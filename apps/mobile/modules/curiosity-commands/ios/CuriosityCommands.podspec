Pod::Spec.new do |s|
  s.name           = 'CuriosityCommands'
  s.version        = '0.1.0'
  s.summary        = 'Curiosity iPadOS command bridge'
  s.description    = 'Renders Curiosity commands in the native main menu.'
  s.author         = 'Curiosity'
  s.homepage       = 'https://localhost/curiosity'
  s.platforms      = {
    :ios => '16.4'
  }
  s.source         = { git: 'https://localhost/curiosity' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
