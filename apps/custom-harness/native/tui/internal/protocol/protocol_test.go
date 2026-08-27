package protocol

import (
	"bytes"
	"strings"
	"testing"
)

func TestCodecRoundTripAndClosedPayload(t *testing.T) {
	var wire bytes.Buffer
	writer := NewCodec(strings.NewReader(""), &wire)
	if err := writer.Send(TypeHello, Hello{Nonce: strings.Repeat("a", 32)}); err != nil {
		t.Fatal(err)
	}
	reader := NewCodec(&wire, &bytes.Buffer{})
	envelope, err := reader.Receive()
	if err != nil {
		t.Fatal(err)
	}
	if envelope.Type != TypeHello || envelope.Version != Version {
		t.Fatalf("unexpected envelope: %#v", envelope)
	}
	hello, err := DecodePayload[Hello](envelope)
	if err != nil {
		t.Fatal(err)
	}
	if err := ValidateHello(hello); err != nil {
		t.Fatal(err)
	}

	envelope.Payload = []byte(`{"nonce":"` + strings.Repeat("a", 32) + `","extra":true}`)
	if _, err := DecodePayload[Hello](envelope); err == nil || !strings.Contains(err.Error(), "PROTOCOL_PAYLOAD_INVALID") {
		t.Fatalf("expected a closed payload failure, got %v", err)
	}
}

func TestCodecRejectsUnknownEnvelopeAndVersion(t *testing.T) {
	cases := []string{
		`{"version":1,"type":"client.hello","payload":{},"extra":true}` + "\n",
		`{"version":2,"type":"client.hello","payload":{}}` + "\n",
	}
	for _, frame := range cases {
		codec := NewCodec(strings.NewReader(frame), &bytes.Buffer{})
		if _, err := codec.Receive(); err == nil {
			t.Fatalf("expected frame rejection for %s", frame)
		}
	}
}

func TestValidateSnapshotFailsClosed(t *testing.T) {
	snapshot := validSnapshot()
	if err := ValidateSnapshot(snapshot); err != nil {
		t.Fatal(err)
	}
	snapshot.Capabilities[0].State = "maybe"
	if err := ValidateSnapshot(snapshot); err == nil || err.Error() != "PROTOCOL_SNAPSHOT_CAPABILITY_INVALID" {
		t.Fatalf("unexpected validation result: %v", err)
	}
}

func validSnapshot() Snapshot {
	return Snapshot{
		ActorID: "local-owner",
		Capabilities: []Capability{{
			ID: "filesystem.read", Reason: "ACTIVE", State: "available",
		}},
		Catalog: Catalog{
			Digest:    "catalog-digest",
			PluginIDs: []string{"curiosity.stock.chat"},
			Commands:  []Command{{Name: "research", Description: "Research", Status: "active"}},
		},
		Effort: "medium", ModelID: "openai-oauth:gpt-5.4-mini", Profile: "trusted-local-single-user",
		Status: "idle", WorkingDirectory: "/workspace",
	}
}
