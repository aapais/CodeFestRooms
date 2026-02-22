# .idx/dev.nix - Configuração ultra-estável para o Escape Room
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
          # Iniciamos apenas o Hub (Login) como preview padrão
          command = ["npm" "run" "start:all"];
          manager = "web";
          env = {
            PORT = "8080"; 
          };
        };
      };
    };
  };
}
