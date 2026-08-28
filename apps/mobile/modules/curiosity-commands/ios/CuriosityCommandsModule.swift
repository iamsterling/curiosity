import ExpoModulesCore
import UIKit

private let commandEvent = "onCommand"
private let commandNotification = Notification.Name(
  "dev.curiosity.workstation.command"
)

struct CuriosityCommandRecord: Record {
  @Field var destructive = false
  @Field var enabled = true
  @Field var id = ""
  @Field var key: String?
  @Field var menu = ""
  @Field var modifiers: [String] = []
  @Field var section = 0
  @Field var selected = false
  @Field var symbol: String?
  @Field var title = ""
}

private final class CuriosityCommandStore {
  static let shared = CuriosityCommandStore()

  private var commands: [CuriosityCommandRecord] = []

  func install() {
    #if compiler(>=6.2)
    if #available(iOS 26.0, *) {
      let configuration = UIMainMenuSystem.Configuration()
      UIMainMenuSystem.shared.setBuildConfiguration(configuration) {
        [weak self] builder in
        self?.build(with: builder)
      }
    }
    #endif
  }

  func update(_ commands: [CuriosityCommandRecord]) {
    self.commands = commands.filter { !$0.id.isEmpty && !$0.title.isEmpty }
    #if compiler(>=6.2)
    if #available(iOS 26.0, *) {
      UIMainMenuSystem.shared.setNeedsRebuild()
    }
    #endif
  }

  #if compiler(>=6.2)
  @available(iOS 26.0, *)
  private func build(with builder: UIMenuBuilder) {
    insert(commands(for: "file"), into: .file, builder: builder)
    insert(commands(for: "view"), into: .view, builder: builder)

    let workCommands = commands(for: "work")
    if !workCommands.isEmpty {
      let menu = UIMenu(
        title: "Work",
        image: UIImage(systemName: "hammer"),
        children: sections(from: workCommands)
      )
      builder.insertSibling(menu, afterMenu: .view)
    }

    insert(commands(for: "help"), into: .help, builder: builder)
  }

  @available(iOS 26.0, *)
  private func commands(for menu: String) -> [CuriosityCommandRecord] {
    commands.filter { $0.menu == menu }
  }

  @available(iOS 26.0, *)
  private func insert(
    _ commands: [CuriosityCommandRecord],
    into menu: UIMenu.Identifier,
    builder: UIMenuBuilder
  ) {
    guard !commands.isEmpty else { return }
    let group = UIMenu(
      title: "",
      options: .displayInline,
      children: sections(from: commands)
    )
    builder.insertChild(group, atStartOfMenu: menu)
  }

  @available(iOS 26.0, *)
  private func sections(
    from commands: [CuriosityCommandRecord]
  ) -> [UIMenuElement] {
    Dictionary(grouping: commands, by: \.section)
      .sorted { $0.key < $1.key }
      .map { _, records in
        UIMenu(
          title: "",
          options: .displayInline,
          children: records.map(commandElement)
        )
      }
  }

  @available(iOS 26.0, *)
  private func commandElement(
    _ command: CuriosityCommandRecord
  ) -> UIMenuElement {
    var attributes: UIMenuElement.Attributes = []
    if !command.enabled { attributes.insert(.disabled) }
    if command.destructive { attributes.insert(.destructive) }
    let state: UIMenuElement.State = command.selected ? .on : .off
    let image = command.symbol.flatMap(UIImage.init(systemName:))
    let action = #selector(UIViewController.curiosityPerformCommand(_:))

    guard let key = command.key, !key.isEmpty else {
      return UICommand(
        title: command.title,
        image: image,
        action: action,
        propertyList: command.id,
        attributes: attributes,
        state: state
      )
    }

    return UIKeyCommand(
      title: command.title,
      image: image,
      action: action,
      input: key,
      modifierFlags: modifierFlags(command.modifiers),
      propertyList: command.id,
      attributes: attributes,
      state: state
    )
  }

  @available(iOS 26.0, *)
  private func modifierFlags(_ modifiers: [String]) -> UIKeyModifierFlags {
    modifiers.reduce(into: UIKeyModifierFlags()) { flags, modifier in
      switch modifier {
      case "command": flags.insert(.command)
      case "control": flags.insert(.control)
      case "option": flags.insert(.alternate)
      case "shift": flags.insert(.shift)
      default: break
      }
    }
  }
  #endif
}

extension UIViewController {
  @objc(curiosityPerformCommand:)
  func curiosityPerformCommand(_ sender: UICommand) {
    guard let id = sender.propertyList as? String else { return }
    NotificationCenter.default.post(
      name: commandNotification,
      object: nil,
      userInfo: ["id": id]
    )
  }
}

public final class CuriosityCommandsAppDelegateSubscriber:
  ExpoAppDelegateSubscriber
{
  public func subscriberDidRegister() {
    CuriosityCommandStore.shared.install()
  }
}

public final class CuriosityCommandsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("CuriosityCommands")

    Events(commandEvent)

    OnStartObserving(commandEvent) {
      NotificationCenter.default.addObserver(
        self,
        selector: #selector(self.handleCommand(_:)),
        name: commandNotification,
        object: nil
      )
    }

    OnStopObserving(commandEvent) {
      NotificationCenter.default.removeObserver(
        self,
        name: commandNotification,
        object: nil
      )
    }

    AsyncFunction("setCommands") {
      (commands: [CuriosityCommandRecord]) in
      CuriosityCommandStore.shared.update(commands)
    }.runOnQueue(.main)
  }

  @objc
  private func handleCommand(_ notification: Notification) {
    guard let id = notification.userInfo?["id"] as? String else { return }
    sendEvent(commandEvent, ["id": id])
  }
}
