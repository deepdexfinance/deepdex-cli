#!/usr/bin/env bash
set -euo pipefail

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║                         DeepDex CLI Installer                            ║
# ╚══════════════════════════════════════════════════════════════════════════╝

REPO_URL="https://github.com/deepdex/deepdex.git"
INSTALL_DIR="${DEEPDEX_INSTALL_DIR:-$HOME/.deepdex}"
BIN_DIR="${DEEPDEX_BIN_DIR:-$HOME/.local/bin}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Print functions
print_banner() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                                                                  ║"
    echo "║     ██████╗ ███████╗███████╗██████╗ ██████╗ ███████╗██╗  ██╗     ║"
    echo "║     ██╔══██╗██╔════╝██╔════╝██╔══██╗██╔══██╗██╔════╝╚██╗██╔╝     ║"
    echo "║     ██║  ██║█████╗  █████╗  ██████╔╝██║  ██║█████╗   ╚███╔╝      ║"
    echo "║     ██║  ██║██╔══╝  ██╔══╝  ██╔═══╝ ██║  ██║██╔══╝   ██╔██╗      ║"
    echo "║     ██████╔╝███████╗███████╗██║     ██████╔╝███████╗██╔╝ ██╗     ║"
    echo "║     ╚═════╝ ╚══════╝╚══════╝╚═╝     ╚═════╝ ╚══════╝╚═╝  ╚═╝     ║"
    echo "║                                                                  ║"
    echo "║           High-Performance CLI for DeepDex Protocol              ║"
    echo "║                                                                  ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

info() {
    echo -e "${BLUE}ℹ${NC}  $1"
}

success() {
    echo -e "${GREEN}✓${NC}  $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC}  $1"
}

error() {
    echo -e "${RED}✗${NC}  $1"
    exit 1
}

step() {
    echo -e "\n${MAGENTA}▸${NC} ${BOLD}$1${NC}"
}

# Detect OS
detect_os() {
    case "$(uname -s)" in
        Linux*)     OS="linux";;
        Darwin*)    OS="darwin";;
        MINGW*|MSYS*|CYGWIN*) OS="windows";;
        *)          OS="unknown";;
    esac
    echo "$OS"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install Bun
install_bun() {
    step "Installing Bun runtime..."
    
    if command_exists bun; then
        local bun_version
        bun_version=$(bun --version 2>/dev/null || echo "unknown")
        success "Bun is already installed (v${bun_version})"
        return 0
    fi
    
    info "Bun not found. Installing..."
    
    if command_exists curl; then
        curl -fsSL https://bun.sh/install | bash
    elif command_exists wget; then
        wget -qO- https://bun.sh/install | bash
    else
        error "Neither curl nor wget found. Please install one of them first."
    fi
    
    # Source bun into current shell
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    
    if command_exists bun; then
        success "Bun installed successfully"
    else
        error "Failed to install Bun. Please install manually: https://bun.sh"
    fi
}

# Clone or update repository
setup_repo() {
    step "Setting up DeepDex CLI..."
    
    if [ -d "$INSTALL_DIR" ]; then
        info "Existing installation found. Updating..."
        cd "$INSTALL_DIR"
        if [ -d ".git" ]; then
            git pull --quiet origin main 2>/dev/null || warn "Could not update from git"
        fi
    else
        info "Cloning repository..."
        git clone --quiet --depth 1 "$REPO_URL" "$INSTALL_DIR" 2>/dev/null || {
            error "Failed to clone repository. Check your internet connection."
        }
        cd "$INSTALL_DIR"
    fi
    
    success "Repository ready at $INSTALL_DIR"
}

# Install dependencies
install_deps() {
    step "Installing dependencies..."
    
    cd "$INSTALL_DIR"
    bun install --silent 2>/dev/null || bun install
    
    success "Dependencies installed"
}

# Create symlink
create_symlink() {
    step "Creating executable symlink..."
    
    # Create bin directory if it doesn't exist
    mkdir -p "$BIN_DIR"
    
    # Create wrapper script
    local wrapper="$BIN_DIR/deepdex"
    
    cat > "$wrapper" << EOF
#!/usr/bin/env bash
exec bun run "$INSTALL_DIR/index.ts" "\$@"
EOF
    
    chmod +x "$wrapper"
    success "Created executable at $wrapper"
}

# Update shell config
update_path() {
    step "Configuring PATH..."
    
    local shell_config=""
    local path_export="export PATH=\"\$PATH:$BIN_DIR\""
    
    # Detect shell config file
    if [ -n "${ZSH_VERSION:-}" ] || [ -f "$HOME/.zshrc" ]; then
        shell_config="$HOME/.zshrc"
    elif [ -n "${BASH_VERSION:-}" ] || [ -f "$HOME/.bashrc" ]; then
        shell_config="$HOME/.bashrc"
    elif [ -f "$HOME/.profile" ]; then
        shell_config="$HOME/.profile"
    fi
    
    # Also check for bun in path
    local bun_export='export BUN_INSTALL="$HOME/.bun"'
    local bun_path='export PATH="$BUN_INSTALL/bin:$PATH"'
    
    if [ -n "$shell_config" ]; then
        # Add deepdex to PATH if not already present
        if ! grep -q "$BIN_DIR" "$shell_config" 2>/dev/null; then
            echo "" >> "$shell_config"
            echo "# DeepDex CLI" >> "$shell_config"
            echo "$path_export" >> "$shell_config"
            info "Added $BIN_DIR to PATH in $shell_config"
        fi
        
        # Ensure bun is in PATH
        if ! grep -q 'BUN_INSTALL' "$shell_config" 2>/dev/null; then
            echo "" >> "$shell_config"
            echo "# Bun" >> "$shell_config"
            echo "$bun_export" >> "$shell_config"
            echo "$bun_path" >> "$shell_config"
        fi
        
        success "Shell configuration updated"
    else
        warn "Could not detect shell config file"
        info "Add the following to your shell config:"
        echo "    $path_export"
    fi
    
    # Update current session
    export PATH="$PATH:$BIN_DIR"
}

# Print success message
print_success() {
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                   Installation Complete! 🎉                      ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${BOLD}Quick Start:${NC}"
    echo ""
    echo -e "    ${CYAN}1.${NC} Restart your terminal or run:"
    echo -e "       ${YELLOW}source ~/.bashrc${NC}  or  ${YELLOW}source ~/.zshrc${NC}"
    echo ""
    echo -e "    ${CYAN}2.${NC} Initialize your wallet:"
    echo -e "       ${YELLOW}deepdex init${NC}"
    echo ""
    echo -e "    ${CYAN}3.${NC} Get testnet tokens:"
    echo -e "       ${YELLOW}deepdex faucet${NC}"
    echo ""
    echo -e "    ${CYAN}4.${NC} Start trading:"
    echo -e "       ${YELLOW}deepdex spot buy ETH/USDC 0.5${NC}"
    echo ""
    echo -e "  ${BOLD}Useful Commands:${NC}"
    echo -e "    ${YELLOW}deepdex help${NC}          Show all commands"
    echo -e "    ${YELLOW}deepdex balance${NC}       Check your balances"
    echo -e "    ${YELLOW}deepdex market list${NC}   View available markets"
    echo ""
    echo -e "  ${BOLD}Documentation:${NC}"
    echo -e "    ${BLUE}https://github.com/deepdex/deepdex${NC}"
    echo ""
}

# Uninstall function
uninstall() {
    step "Uninstalling DeepDex CLI..."
    
    # Remove installation directory
    if [ -d "$INSTALL_DIR" ]; then
        rm -rf "$INSTALL_DIR"
        success "Removed $INSTALL_DIR"
    fi
    
    # Remove symlink
    if [ -f "$BIN_DIR/deepdex" ]; then
        rm -f "$BIN_DIR/deepdex"
        success "Removed $BIN_DIR/deepdex"
    fi
    
    echo ""
    success "DeepDex CLI has been uninstalled"
    info "You may want to remove the PATH entry from your shell config"
}

# Main installation
main() {
    print_banner
    
    # Check for uninstall flag
    if [ "${1:-}" = "--uninstall" ] || [ "${1:-}" = "-u" ]; then
        uninstall
        exit 0
    fi
    
    # Check for help flag
    if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
        echo "DeepDex CLI Installer"
        echo ""
        echo "Usage: ./install.sh [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  -h, --help        Show this help message"
        echo "  -u, --uninstall   Uninstall DeepDex CLI"
        echo ""
        echo "Environment Variables:"
        echo "  DEEPDEX_INSTALL_DIR    Installation directory (default: ~/.deepdex)"
        echo "  DEEPDEX_BIN_DIR        Binary directory (default: ~/.local/bin)"
        exit 0
    fi
    
    local os
    os=$(detect_os)
    info "Detected OS: $os"
    
    # Check for git
    if ! command_exists git; then
        error "Git is required but not installed. Please install git first."
    fi
    
    install_bun
    setup_repo
    install_deps
    create_symlink
    update_path
    print_success
}

# Run main
main "$@"

