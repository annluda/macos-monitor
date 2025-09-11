class MacosMonitor < Formula
  desc "Backend for macOS monitoring tool"
  homepage "https://github.com/gemini/macos-monitor" # Placeholder
  url "file://#{__dir__}" # This formula is designed to be installed from local source
  version "1.0.0"

  depends_on "go" => :build

  def install
    # This formula is intended to be built from source in the project directory
    # Change directory to the backend source
    cd "backend" do
      system "go", "build", "-o", bin/"macos-monitor-backend", "main.go"
    end
  end

  def service
    # Homebrew service definition
    {
      run: [opt_bin/"macos-monitor-backend"],
      keep_alive: true,
      log_path: var/"log/macos-monitor.log",
      error_log_path: var/"log/macos-monitor.error.log"
    }
  end

  test do
    # A simple test to check if the binary was installed correctly
    assert_predicate bin/"macos-monitor-backend", :exist?
  end
end
