# .idx/dev.nix - Versão Manual (Sem Erros de Proxy)
{ pkgs, ... }: {
  channel = "stable-23.11"; 
  packages = [ pkgs.nodejs_20 ];
  idx = {
    extensions = [ "dbaeumer.vscode-eslint" "esbenp.prettier-vscode" "google.gemini-vscode" ];
    workspace = {
      onCreate = { npm-install = "npm install && npm install --workspaces"; };
    };
    previews = {
      enable = false; # DESATIVADO para evitar o erro 9002
    };
  };
}
