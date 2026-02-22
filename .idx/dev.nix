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
          # Abre a porta 4000 (Game Hub) por defeito na página de Join
          command = ["npm" "run" "start:hub"];
          manager = "web";
          env = {
            PORT = "4000";
          };
        };
      };
    };
  };
}
