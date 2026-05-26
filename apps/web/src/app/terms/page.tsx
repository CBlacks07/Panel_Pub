import Link from "next/link";

export const metadata = {
  title: "Conditions d'utilisation — Boutiki",
  description: "Conditions générales d'utilisation de l'application Boutiki.",
};

export default function TermsPage() {
  const updated = "26 mai 2026";
  const appName = "Boutiki";
  const company = "OPS CORPORATION";
  const contact = "https://wa.me/22893914694";

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-black text-gray-900 text-lg">{appName}</Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← Retour à l&apos;accueil</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-10">
          <p className="text-xs font-bold tracking-widest uppercase text-blue-500 mb-3">Légal</p>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">Conditions d&apos;utilisation</h1>
          <p className="text-gray-500 text-sm">Dernière mise à jour : {updated}</p>
        </div>

        <div className="space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">1. Acceptation des conditions</h2>
            <p>
              En utilisant l&apos;application {appName} (ci-après &quot;l&apos;Application&quot;), vous acceptez d&apos;être lié par
              les présentes Conditions d&apos;utilisation. Si vous n&apos;acceptez pas ces conditions, veuillez ne pas utiliser l&apos;Application.
              L&apos;Application est développée et opérée par <strong>{company}</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">2. Description du service</h2>
            <p>
              {appName} est une plateforme SaaS permettant aux commerçants de créer et gérer leur catalogue de produits en ligne,
              et de recevoir des commandes de leurs clients via WhatsApp. L&apos;Application propose :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>La création d&apos;une boutique en ligne avec catalogue de produits</li>
              <li>Un système de commande via WhatsApp</li>
              <li>Une marketplace publique de toutes les boutiques</li>
              <li>Des statistiques de vues pour les vendeurs</li>
              <li>Un système de notation des boutiques</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">3. Comptes et inscription</h2>
            <p>Pour utiliser les fonctionnalités vendeur, vous devez créer un compte. Vous vous engagez à :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Fournir des informations exactes et à jour lors de l&apos;inscription</li>
              <li>Maintenir la confidentialité de votre mot de passe</li>
              <li>Notifier immédiatement tout accès non autorisé à votre compte</li>
              <li>Être responsable de toutes les activités effectuées sous votre compte</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">4. Obligations du vendeur</h2>
            <p>En tant que vendeur sur {appName}, vous vous engagez à :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Ne publier que des produits légaux et conformes aux lois en vigueur</li>
              <li>Fournir des descriptions et des prix exacts pour vos produits</li>
              <li>Ne pas publier de contenu trompeur, frauduleux ou offensant</li>
              <li>Respecter les droits de propriété intellectuelle (images, marques)</li>
              <li>Honorer les commandes passées via l&apos;Application</li>
              <li>Ne pas utiliser l&apos;Application pour des activités illicites</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">5. Forfaits et paiements</h2>
            <p>
              {appName} propose un forfait gratuit et des forfaits payants. Les paiements pour les forfaits premium
              s&apos;effectuent via WhatsApp avec {company}. Aucun paiement en ligne n&apos;est traité directement par l&apos;Application.
            </p>
            <p className="mt-2">
              {company} se réserve le droit de modifier les tarifs avec un préavis de 30 jours.
              Les forfaits payants sont non remboursables sauf en cas d&apos;erreur de facturation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">6. Contenu interdit</h2>
            <p>Il est strictement interdit de publier sur {appName} :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Des produits contrefaits ou portant atteinte aux droits de marque</li>
              <li>Des substances illicites ou dangereuses</li>
              <li>Du contenu pornographique ou à caractère sexuel</li>
              <li>Des armes ou munitions</li>
              <li>Tout contenu incitant à la haine, la discrimination ou la violence</li>
              <li>Des produits ou services frauduleux</li>
            </ul>
            <p className="mt-2">
              {company} se réserve le droit de supprimer tout contenu non conforme et de suspendre les comptes en infraction, sans préavis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">7. Propriété intellectuelle</h2>
            <p>
              L&apos;Application, son logo, son code source et ses fonctionnalités sont la propriété exclusive de {company}.
              En publiant du contenu (photos, descriptions), vous accordez à {company} une licence non exclusive pour afficher
              ce contenu dans le cadre du service. Vous conservez tous vos droits sur ce contenu.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">8. Limitation de responsabilité</h2>
            <p>
              {company} agit en tant qu&apos;intermédiaire technique entre vendeurs et acheteurs. Nous ne sommes pas responsables de :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>La qualité, la conformité ou la livraison des produits vendus</li>
              <li>Les litiges entre vendeurs et acheteurs</li>
              <li>Les pertes de données dues à des facteurs hors de notre contrôle</li>
              <li>Les interruptions temporaires du service pour maintenance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">9. Résiliation</h2>
            <p>
              Vous pouvez supprimer votre compte à tout moment en nous contactant. {company} peut résilier ou suspendre votre
              accès en cas de violation des présentes conditions, sans préavis ni remboursement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">10. Modifications</h2>
            <p>
              {company} se réserve le droit de modifier ces conditions à tout moment. Les modifications entrent en vigueur
              dès leur publication. L&apos;utilisation continue de l&apos;Application vaut acceptation des nouvelles conditions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">11. Contact</h2>
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
        <p>© {new Date().getFullYear()} {appName} — <Link href="/privacy" className="hover:text-gray-600">Politique de confidentialité</Link></p>
      </footer>
    </div>
  );
}
