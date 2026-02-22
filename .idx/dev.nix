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
        # Instala dependências automaticamente na criação
        npm-install = "npm install && npm install --workspaces";
      };
      onStart = {
        # Sempre que o workspace abre, garante que as dependências estão lá
        # e avisa o utilizador para iniciar o jogo
        welcome-msg = "echo '🚀 BEM-VINDO AO GEMINI ESCAPE ROOM! Escreve: npm run start:all para iniciar os sistemas.'";
      };
    };

    previews = {
      enable = true;
      previews = {
        web = {
          # Não corremos o comando aqui para evitar loops de 502/Proxy
          # O utilizador corre o comando no terminal e o IDX deteta a porta
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
