{ pkgs, ... }: {
  channel = "stable-23.11"; 
  packages = [ pkgs.nodejs_20 ];
  idx = {
    extensions = [ "dbaeumer.vscode-eslint" "esbenp.prettier-vscode" "google.gemini-vscode" ];
    workspace = {
      onCreate = { npm-install = "npm install && npm install --workspaces"; };
    };
    previews = {
      enable = true;
      previews = {
        web = {
          # Um único comando, um único porto.
          command = ["node" "game-hub/server.js"];
          manager = "web";
          env = { PORT = "$PORT"; };
        };
      };
    };
  };
}
