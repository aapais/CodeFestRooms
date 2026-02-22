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
        # O IDX apenas observa as portas. Tu corres o comando no terminal.
        web = {
          command = ["npm" "run" "start:hub"];
          manager = "web";
          env = {
            PORT = "$PORT"; 
          };
        };
      };
    };
  };
}
