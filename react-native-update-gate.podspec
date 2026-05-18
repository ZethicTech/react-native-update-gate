require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name         = 'react-native-update-gate'
  s.version      = package['version']
  s.summary      = package['description']
  s.homepage     = package['homepage']
  s.license      = package['license']
  s.authors      = package['author']

  s.platforms    = { :ios => '13.0' }
  s.source       = { :git => 'https://github.com/zethic/react-native-update-gate.git', :tag => "v#{s.version}" }

  # Intentionally no source_files — the iOS implementation is pure JavaScript.
  # This podspec exists solely so React Native's auto-linking sees the package on iOS.
  s.source_files = []

  s.dependency 'React-Core'
end
