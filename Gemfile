# Ruby dependencies for the iOS release pipeline.
#
# The only dependency is fastlane — the tool we use to archive the
# app, sign it with local credentials, and upload to App Store Connect.
# Anyone with this repo + Xcode + ruby can ship with `bundle exec fastlane beta`.
#
# Install once:   bundle install
# Update:         bundle update

source "https://rubygems.org"

gem "fastlane"

plugins_path = File.join(File.dirname(__FILE__), 'fastlane', 'Pluginfile')
eval_gemfile(plugins_path) if File.exist?(plugins_path)
