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
        # Definimos todas as portas para que o IDX as exponha corretamente
        hub = { command = ["npm" "run" "start:hub"]; manager = "web"; id = "web"; env = { PORT = "4000"; }; };
        room1 = { command = ["npm" "run" "start:room1"]; manager = "web"; env = { PORT = "3000"; }; };
        room2 = { command = ["npm" "run" "start:room2"]; manager = "web"; env = { PORT = "3002"; }; };
        room3 = { command = ["npm" "run" "start:room3"]; manager = "web"; env = { PORT = "3003"; }; };
        final = { command = ["npm" "run" "start:final"]; manager = "web"; env = { PORT = "8080"; }; };
      };
    };
  };
}
