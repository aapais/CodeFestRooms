# .idx/dev.nix - Environment Configuration
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-23.11"; # or "unstable"

  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_20
  ];

  # Sets environment variables in the workspace
  env = {};
  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      "dbaeumer.vscode-eslint"
      "esbenp.prettier-vscode"
    ];
    workspace = {
      # Runs when a workspace is first created with this `dev.nix` file
      onCreate = {
        npm-install = "npm ci && npm install --workspaces";
        # Open editors for the READMEs
        default.openFiles = [ "README.md" "rooms/room1-archaeology/README.md" ];
      };
      # Runs when a workspace is (re)started
      onStart = {
        # Ensure dependencies are up to date
        npm-install = "npm install"; 
      };
    };
    # Enable previews and customize configuration
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm" "run" "start:room1"];
          manager = "web";
          env = {
            PORT = "$PORT";
          };
        };
      };
    };
  };
}
