package main

import (
	"errors"
	"fmt"
	"io"
	"net"
	"os"

	tea "charm.land/bubbletea/v2"
	"github.com/iamsterling/curiosity/apps/custom-harness/native/tui/internal/protocol"
	"github.com/iamsterling/curiosity/apps/custom-harness/native/tui/internal/ui"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, stableError(err))
		os.Exit(1)
	}
}

func run() error {
	socketPath := os.Getenv("CURIOSITY_TUI_SOCKET")
	nonce := os.Getenv("CURIOSITY_TUI_NONCE")
	if socketPath == "" || nonce == "" {
		return errors.New("TUI_PROTOCOL_CONFIGURATION_REQUIRED")
	}
	connection, err := net.Dial("unix", socketPath)
	if err != nil {
		return fmt.Errorf("TUI_PROTOCOL_CONNECT_FAILED: %w", err)
	}
	defer connection.Close()
	codec := protocol.NewCodec(connection, connection)
	if err := codec.Send(protocol.TypeHello, protocol.Hello{Nonce: nonce}); err != nil {
		return err
	}
	envelope, err := codec.Receive()
	if err != nil {
		return err
	}
	if envelope.Type != protocol.TypeSnapshot {
		return errors.New("TUI_PROTOCOL_INITIAL_SNAPSHOT_REQUIRED")
	}
	snapshot, err := protocol.DecodePayload[protocol.Snapshot](envelope)
	if err != nil {
		return err
	}
	if err := protocol.ValidateSnapshot(snapshot); err != nil {
		return err
	}
	program := tea.NewProgram(ui.NewModel(snapshot, codec))
	go forwardHostMessages(codec, program)
	if _, err := program.Run(); err != nil {
		return fmt.Errorf("TUI_RUN_FAILED: %w", err)
	}
	_ = codec.Send(protocol.TypeQuit, struct{}{})
	return nil
}

func forwardHostMessages(codec *protocol.Codec, program *tea.Program) {
	for {
		envelope, err := codec.Receive()
		if err != nil {
			if !errors.Is(err, io.EOF) {
				program.Send(ui.ProtocolErrorMsg{Err: err})
			}
			return
		}
		switch envelope.Type {
		case protocol.TypeSnapshot:
			snapshot, err := protocol.DecodePayload[protocol.Snapshot](envelope)
			if err == nil {
				err = protocol.ValidateSnapshot(snapshot)
			}
			if err != nil {
				program.Send(ui.ProtocolErrorMsg{Err: err})
				continue
			}
			program.Send(ui.SnapshotMsg{Snapshot: snapshot})
		case protocol.TypeHostError:
			hostError, err := protocol.DecodePayload[protocol.HostError](envelope)
			if err != nil {
				program.Send(ui.ProtocolErrorMsg{Err: err})
				continue
			}
			program.Send(ui.ProtocolErrorMsg{Err: errors.New(hostError.Code)})
		default:
			program.Send(ui.ProtocolErrorMsg{Err: errors.New("TUI_PROTOCOL_MESSAGE_UNSUPPORTED")})
		}
	}
}

func stableError(err error) string {
	if err == nil {
		return "TUI_FAILED"
	}
	return err.Error()
}
