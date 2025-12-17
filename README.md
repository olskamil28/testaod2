# testaod2 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/README.md b/README.md
index 0ced87af3e3e3c80a9950b407070350c2738b4e7..e4c6ba944f4524fce2d62c335e64091b728a067c 100644
--- a/README.md
+++ b/README.md
@@ -1 +1,38 @@
-# testaod2
\ No newline at end of file
+# Mini boutique Telegram
+
+Application WebApp Telegram minimaliste pour présenter des produits, constituer un panier et envoyer la commande vers un bot Telegram.
+
+## Prérequis
+- Node.js 18+
+- Un bot Telegram et un chat cible pour recevoir les commandes
+
+## Installation
+```bash
+npm install
+```
+
+## Variables d'environnement
+- `BOT_TOKEN` : token du bot Telegram (obligatoire en production pour envoyer les commandes).
+- `ORDER_CHAT_ID` : identifiant du chat qui recevra les commandes (sinon l'app utilisera `user.id` fourni par Telegram WebApp).
+- `PORT` : port HTTP (optionnel, 3000 par défaut).
+
+Vous pouvez copier un fichier `.env` localement (non fourni) pour charger ces valeurs avant de lancer le serveur.
+
+## Démarrage
+```bash
+npm start
+```
+
+Le serveur expose :
+- `/` : l'interface WebApp.
+- `POST /api/order` : reçoit la commande et la transmet au bot Telegram si `BOT_TOKEN` est présent.
+- `/health` : vérification de l'état du serveur.
+
+## Notes sur l'intégration Telegram
+- Dans Telegram, configurez le domaine de votre serveur dans les paramètres du bot (`BotFather`), puis renseignez l'URL de la WebApp dans un bouton ou une commande.
+- L'app lit `window.Telegram.WebApp.initDataUnsafe.user` pour récupérer l'utilisateur connecté et l'afficher.
+- Si vous testez en local sans WebApp, l'affichage se fait avec un utilisateur invité.
+
+## Personnalisation rapide
+- Les produits affichés sont définis dans `public/script.js` (`products`).
+- Le thème visuel est défini dans `public/styles.css`.
 
EOF
)
