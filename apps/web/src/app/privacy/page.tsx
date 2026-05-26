import Link from "next/link";

export const metadata = {
  title: "Politique de confidentialité — Boutiki",
  description: "Politique de confidentialité de l'application Boutiki, développée par OPS CORPORATION.",
};

export default function PrivacyPage() {
  const updated = "26 mai 2026";
  const contact = "https://wa.me/22893914694";
  const appName = "Boutiki";
  const company = "OPS CORPORATION";

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-black text-gray-900 text-lg">{appName}</Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← Retour à l&apos;accueil</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-10">
          <p className="text-xs font-bold tracking-widest uppercase text-blue-500 mb-3">Légal</p>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">Politique de confidentialité</h1>
          <p className="text-gray-500 text-sm">Dernière mise à jour : {updated}</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">1. Qui sommes-nous ?</h2>
            <p>
              {appName} est une application mobile et web de création de catalogues en ligne, développée et opérée par <strong>{company}</strong>.
              L&apos;application permet aux commerçants de créer leur boutique en ligne et de recevoir des commandes via WhatsApp.
            </p>
            <p className="mt-2">
              Pour toute question relative à cette politique, vous pouvez nous contacter via WhatsApp :{" "}
              <a href={contact} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">+228 93 91 46 94</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">2. Données collectées</h2>
            <p>Nous collectons les données suivantes lors de l&apos;utilisation de {appName} :</p>
            <table className="w-full mt-4 border border-gray-200 rounded-xl overflow-hidden text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-bold text-gray-700">Donnée</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-700">Finalité</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-700">Obligatoire</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ["Adresse e-mail", "Création de compte et authentification", "Oui"],
                  ["Mot de passe (chiffré)", "Sécurisation du compte", "Oui"],
                  ["Nom de la boutique", "Affichage public de la boutique", "Oui"],
                  ["Numéro WhatsApp", "Réception des commandes clients", "Non"],
                  ["Photos de produits", "Affichage dans le catalogue", "Non"],
                  ["Localisation (ville, GPS)", "Tri des boutiques par proximité", "Non"],
                  ["Type d'activité commerciale", "Personnalisation de l'interface", "Oui"],
                  ["Données d'utilisation (vues)", "Statistiques pour le vendeur", "Automatique"],
                ].map(([d, f, o]) => (
                  <tr key={d} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{d}</td>
                    <td className="px-4 py-3 text-gray-600">{f}</td>
                    <td className="px-4 py-3 text-gray-600">{o}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-sm text-gray-500">
              Nous ne collectons <strong>pas</strong> de données bancaires, de numéros de carte, ni de mots de passe en clair.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">3. Utilisation des données</h2>
            <p>Vos données sont utilisées exclusivement pour :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Fournir et améliorer les services de {appName}</li>
              <li>Afficher votre boutique aux clients sur la marketplace</li>
              <li>Permettre aux clients de vous contacter via WhatsApp</li>
              <li>Vous envoyer des notifications importantes sur votre compte (uniquement)</li>
              <li>Générer des statistiques anonymes sur l&apos;utilisation de l&apos;application</li>
            </ul>
            <p className="mt-3">Nous ne vendons, ne louons et ne partageons <strong>jamais</strong> vos données personnelles à des tiers à des fins commerciales.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">4. Partage des données</h2>
            <p>Vos données peuvent être transmises aux prestataires techniques suivants, uniquement dans la mesure nécessaire au fonctionnement de l&apos;application :</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li><strong>Supabase</strong> (États-Unis) — Hébergement de la base de données et authentification. Conforme RGPD.</li>
              <li><strong>Cloudinary</strong> (États-Unis) — Hébergement et optimisation des images de produits.</li>
              <li><strong>WhatsApp / Meta</strong> — Uniquement pour ouvrir des conversations de commande. Nous ne transmettons aucune donnée à Meta directement.</li>
              <li><strong>Expo / EAS</strong> — Mise à jour de l&apos;application mobile. Aucune donnée personnelle transmise.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">5. Localisation</h2>
            <p>
              L&apos;application peut demander l&apos;accès à votre localisation GPS pour afficher les boutiques proches de vous et/ou
              localiser votre boutique sur la carte. Cette fonctionnalité est <strong>optionnelle</strong> et vous pouvez la refuser
              sans impact sur les fonctionnalités principales.
            </p>
            <p className="mt-2">
              Vos coordonnées GPS ne sont stockées que si vous activez explicitement la géolocalisation de votre boutique dans votre profil vendeur.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">6. Conservation des données</h2>
            <p>
              Vos données sont conservées aussi longtemps que votre compte est actif. Si vous souhaitez supprimer votre compte
              et toutes vos données, contactez-nous via WhatsApp. La suppression est effectuée sous 30 jours.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">7. Vos droits</h2>
            <p>Conformément aux réglementations applicables, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Droit d&apos;accès</strong> — Obtenir une copie de vos données personnelles</li>
              <li><strong>Droit de rectification</strong> — Corriger des données inexactes</li>
              <li><strong>Droit à l&apos;effacement</strong> — Supprimer votre compte et vos données</li>
              <li><strong>Droit à la portabilité</strong> — Recevoir vos données dans un format structuré</li>
              <li><strong>Droit d&apos;opposition</strong> — Vous opposer à certains traitements</li>
            </ul>
            <p className="mt-3">
              Pour exercer ces droits, contactez-nous via{" "}
              <a href={contact} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">WhatsApp</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">8. Sécurité</h2>
            <p>
              Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données contre tout accès
              non autorisé, modification, divulgation ou destruction. Les mots de passe sont chiffrés et jamais stockés en clair.
              Les communications entre l&apos;application et nos serveurs utilisent le protocole HTTPS.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">9. Modifications</h2>
            <p>
              Nous pouvons mettre à jour cette politique à tout moment. En cas de modification significative,
              nous vous en informerons via l&apos;application. La date de dernière mise à jour est indiquée en haut de cette page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">10. Contact</h2>
            <p>
              Pour toute question, demande ou réclamation relative à cette politique de confidentialité :
            </p>
            <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="font-bold text-gray-900">{company}</p>
              <p className="text-gray-600 text-sm mt-1">Application : {appName}</p>
              <p className="text-gray-600 text-sm">
                WhatsApp :{" "}
                <a href={contact} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">+228 93 91 46 94</a>
              </p>
            </div>
          </section>
        </div>
      </div>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} {appName} — <Link href="/terms" className="hover:text-gray-600">Conditions d&apos;utilisation</Link></p>
      </footer>
    </div>
  );
}
