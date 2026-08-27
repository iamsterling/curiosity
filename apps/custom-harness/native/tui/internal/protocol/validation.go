package protocol

import "errors"

func ValidateHello(hello Hello) error {
	if len(hello.Nonce) < 32 || len(hello.Nonce) > 256 {
		return errors.New("PROTOCOL_NONCE_INVALID")
	}
	return nil
}

func ValidateSnapshot(snapshot Snapshot) error {
	if snapshot.ActorID == "" || snapshot.ModelID == "" || snapshot.Effort == "" || snapshot.WorkingDirectory == "" {
		return errors.New("PROTOCOL_SNAPSHOT_IDENTITY_INVALID")
	}
	if snapshot.Status != "idle" && snapshot.Status != "working" {
		return errors.New("PROTOCOL_SNAPSHOT_STATUS_INVALID")
	}
	if snapshot.Catalog.Digest == "" || len(snapshot.Catalog.PluginIDs) > 256 || len(snapshot.Catalog.Commands) > 512 {
		return errors.New("PROTOCOL_SNAPSHOT_CATALOG_INVALID")
	}
	if len(snapshot.Capabilities) > 256 || len(snapshot.Messages) > 512 {
		return errors.New("PROTOCOL_SNAPSHOT_BOUNDS_INVALID")
	}
	if len(snapshot.InspectorText) > 128*1024 {
		return errors.New("PROTOCOL_SNAPSHOT_INSPECTOR_INVALID")
	}
	for _, capability := range snapshot.Capabilities {
		if capability.ID == "" || (capability.State != "catalogued" && capability.State != "scaffolded" && capability.State != "available" && capability.State != "qualified" && capability.State != "unavailable") {
			return errors.New("PROTOCOL_SNAPSHOT_CAPABILITY_INVALID")
		}
	}
	for _, command := range snapshot.Catalog.Commands {
		if command.Name == "" || (command.Status != "active" && command.Status != "compatibility-deprecated") {
			return errors.New("PROTOCOL_SNAPSHOT_COMMAND_INVALID")
		}
	}
	for _, message := range snapshot.Messages {
		if message.Role != "user" && message.Role != "assistant" {
			return errors.New("PROTOCOL_SNAPSHOT_MESSAGE_INVALID")
		}
	}
	return nil
}
