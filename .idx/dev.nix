# .idx/dev.nix - Environment Configuration
{ pkgs, ... }: {
  channel = "stable-23.11"; 

  packages = [
    pkgs.nodejs_20
  ];

  idx = {
    extensions = [
      "dbaeumer.vscode-eslint"
      "esbenp.prettier-vscode"
      "google.gemini-vscode"
    ];

    workspace = {
      onCreate = {
        npm-install = "npm install && npm install --workspaces";
      };
    };

    previews = {
      enable = true;
      previews = {
        web = {
          # INICIAR TUDO AUTOMATICAMENTE: Hub + 4 Rooms
          command = ["node" "start-all.js"];
          manager = "web";
          env = {
            PORT = "$PORT"; 
          };
        };
      };
    };
  };
}
