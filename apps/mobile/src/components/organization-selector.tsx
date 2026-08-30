import {
  Button,
  Divider,
  Host,
  HStack,
  Image,
  Menu,
  Spacer,
  Text,
} from "@expo/ui/swift-ui";
import {
  accessibilityHint as axHint,
  accessibilityLabel as axLabel,
  buttonStyle,
  font,
  foregroundStyle,
  frame,
  menuIndicator,
  menuStyle,
  padding,
} from "@expo/ui/swift-ui/modifiers";
import { StyleSheet } from "react-native";
import { palette } from "../theme";

export interface OrganizationOption {
  readonly id: string;
  readonly name: string;
}

export const OrganizationSelector = ({
  activeOrganizationId,
  onAddOrganization,
  onSelectOrganization,
  organizations,
}: {
  readonly activeOrganizationId: string;
  readonly onAddOrganization: () => void;
  readonly onSelectOrganization: (organizationId: string) => void;
  readonly organizations: readonly OrganizationOption[];
}) => {
  const activeOrganization =
    organizations.find(({ id }) => id === activeOrganizationId) ??
    organizations[0];
  if (!activeOrganization) return null;

  return (
    <Host
      matchContents={{ vertical: true }}
      seedColor={palette.focus}
      style={styles.host}
      useViewportSizeMeasurement
    >
      <Menu
        label={
          <HStack alignment="center" spacing={7}>
            <Image color={palette.focus} size={17} systemName="building.2" />
            <Text
              modifiers={[
                font({ size: 15, weight: "semibold" }),
                foregroundStyle(palette.textPrimary),
              ]}
            >
              {activeOrganization.name}
            </Text>
            <Image
              color={palette.textSecondary}
              size={11}
              systemName="chevron.up.chevron.down"
            />
          </HStack>
        }
        modifiers={[
          axHint("Selects the active organization."),
          axLabel(`Organization: ${activeOrganization.name}`),
          buttonStyle("glass"),
          frame({ height: 44 }),
          menuIndicator("hidden"),
          menuStyle("button"),
          padding({ horizontal: 12 }),
        ]}
      >
        {organizations.map((organization) => (
          <Button
            key={organization.id}
            onPress={() => onSelectOrganization(organization.id)}
          >
            <HStack alignment="center" spacing={8}>
              <Text modifiers={[font({ size: 14, weight: "medium" })]}>
                {organization.name}
              </Text>
              <Spacer />
              {organization.id === activeOrganization.id ? (
                <Image color={palette.focus} size={13} systemName="checkmark" />
              ) : null}
            </HStack>
          </Button>
        ))}
        <Divider />
        <Button
          modifiers={[axLabel("New organization")]}
          onPress={onAddOrganization}
        >
          <HStack alignment="center" spacing={8}>
            <Image color={palette.focus} size={14} systemName="plus" />
            <Text modifiers={[font({ size: 14, weight: "medium" })]}>
              New Organization…
            </Text>
          </HStack>
        </Button>
      </Menu>
    </Host>
  );
};

const styles = StyleSheet.create({
  host: { height: 44, width: 160 },
});
