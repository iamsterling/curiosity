package protocol

import (
	"bufio"
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"sync"
)

const (
	Version       = 1
	MaximumFrame  = 1 << 20
	TypeHello     = "client.hello"
	TypeSnapshot  = "host.snapshot"
	TypeTurn      = "client.turn.submit"
	TypeQuit      = "client.quit"
	TypeHostError = "host.error"
)

type Envelope struct {
	Version int             `json:"version"`
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

type Hello struct {
	Nonce string `json:"nonce"`
}

type TurnSubmit struct {
	Text string `json:"text"`
}

type HostError struct {
	Code string `json:"code"`
}

type Command struct {
	Description string `json:"description"`
	Name        string `json:"name"`
	Status      string `json:"status"`
}

type Capability struct {
	ID     string `json:"id"`
	Reason string `json:"reason"`
	State  string `json:"state"`
}

type Catalog struct {
	Digest        string    `json:"digest"`
	PluginIDs     []string  `json:"pluginIds"`
	Commands      []Command `json:"commands"`
	ToolNames     []string  `json:"toolNames"`
	WorkflowNames []string  `json:"workflowNames"`
}

type Message struct {
	Role     string `json:"role"`
	Sequence int    `json:"sequence"`
	Text     string `json:"text"`
}

type Snapshot struct {
	ActorID          string       `json:"actorId"`
	Capabilities     []Capability `json:"capabilities"`
	Catalog          Catalog      `json:"catalog"`
	Effort           string       `json:"effort"`
	Error            string       `json:"error"`
	Messages         []Message    `json:"messages"`
	ModelID          string       `json:"modelId"`
	Profile          string       `json:"profile"`
	Status           string       `json:"status"`
	StreamingText    string       `json:"streamingText"`
	SubmittedText    string       `json:"submittedText"`
	ThreadID         string       `json:"threadId"`
	ThreadTitle      string       `json:"threadTitle"`
	WorkingDirectory string       `json:"workingDirectory"`
}

type Codec struct {
	scanner *bufio.Scanner
	writer  *bufio.Writer
	mu      sync.Mutex
}

func NewCodec(reader io.Reader, writer io.Writer) *Codec {
	scanner := bufio.NewScanner(reader)
	scanner.Buffer(make([]byte, 4096), MaximumFrame)
	return &Codec{scanner: scanner, writer: bufio.NewWriter(writer)}
}

func (codec *Codec) Receive() (Envelope, error) {
	if !codec.scanner.Scan() {
		if err := codec.scanner.Err(); err != nil {
			return Envelope{}, fmt.Errorf("PROTOCOL_READ_FAILED: %w", err)
		}
		return Envelope{}, io.EOF
	}
	return decodeEnvelope(codec.scanner.Bytes())
}

func (codec *Codec) Send(messageType string, payload any) error {
	if messageType == "" {
		return errors.New("PROTOCOL_TYPE_REQUIRED")
	}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("PROTOCOL_PAYLOAD_INVALID: %w", err)
	}
	frame, err := json.Marshal(Envelope{
		Version: Version,
		Type:    messageType,
		Payload: payloadBytes,
	})
	if err != nil {
		return fmt.Errorf("PROTOCOL_FRAME_INVALID: %w", err)
	}
	if len(frame) > MaximumFrame {
		return errors.New("PROTOCOL_FRAME_TOO_LARGE")
	}
	codec.mu.Lock()
	defer codec.mu.Unlock()
	if _, err := codec.writer.Write(append(frame, '\n')); err != nil {
		return fmt.Errorf("PROTOCOL_WRITE_FAILED: %w", err)
	}
	if err := codec.writer.Flush(); err != nil {
		return fmt.Errorf("PROTOCOL_FLUSH_FAILED: %w", err)
	}
	return nil
}

func DecodePayload[T any](envelope Envelope) (T, error) {
	var result T
	decoder := json.NewDecoder(bytes.NewReader(envelope.Payload))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&result); err != nil {
		return result, fmt.Errorf("PROTOCOL_PAYLOAD_INVALID: %w", err)
	}
	if decoder.Decode(&struct{}{}) != io.EOF {
		return result, errors.New("PROTOCOL_PAYLOAD_TRAILING_DATA")
	}
	return result, nil
}

func decodeEnvelope(frame []byte) (Envelope, error) {
	if len(frame) == 0 || len(frame) > MaximumFrame {
		return Envelope{}, errors.New("PROTOCOL_FRAME_INVALID")
	}
	decoder := json.NewDecoder(bytes.NewReader(frame))
	decoder.DisallowUnknownFields()
	var envelope Envelope
	if err := decoder.Decode(&envelope); err != nil {
		return Envelope{}, fmt.Errorf("PROTOCOL_FRAME_INVALID: %w", err)
	}
	if decoder.Decode(&struct{}{}) != io.EOF {
		return Envelope{}, errors.New("PROTOCOL_FRAME_TRAILING_DATA")
	}
	if envelope.Version != Version {
		return Envelope{}, errors.New("PROTOCOL_VERSION_UNSUPPORTED")
	}
	if envelope.Type == "" || len(envelope.Payload) == 0 {
		return Envelope{}, errors.New("PROTOCOL_ENVELOPE_INCOMPLETE")
	}
	return envelope, nil
}
