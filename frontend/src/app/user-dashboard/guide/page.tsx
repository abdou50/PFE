"use client";

import { useState, useEffect } from "react";
import LogoutButton from "../../components/LogoutButton";
import Image from "next/image";

export default function UserDashboard() {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [department, setDepartment] = useState<string | null>(null);

  useEffect(() => {
    const storedFirstName = localStorage.getItem("firstName");
    const storedDepartment = localStorage.getItem("department");

    console.log("📥 Retrieved from LocalStorage:");
    console.log("First Name:", storedFirstName);
    console.log("Department:", storedDepartment);

    setFirstName(storedFirstName);
    setDepartment(storedDepartment);
  }, []);

  return (
    <div className="p-4">
       <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          Bonjour {firstName || "Utilisateur"}, vous êtes dans le département {department || "N/A"}.
        </h1>
        <Image src="/assets/cni1.png" alt="CNI Logo" width={100} height={100} className="mb-4" style={{ background: "transparent" }} />
      </div>
      
      <div className="mt-4 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold">Qu'est-ce que le CNI ?</h2>
        <p>
          Le Centre National d’Informatique (CNI) est une institution chargée de la gestion et de l'optimisation des systèmes d'information nationaux.
          Ce site permet de gérer et suivre les réclamations liées aux services du CNI, en facilitant la communication entre les citoyens et l'administration.
        </p>
        
        <h2 className="text-lg font-semibold mt-4">Pourquoi utiliser ce site ?</h2>
        <p>
          Ce site vous permet de déposer vos réclamations en ligne, de suivre leur état d'avancement en temps réel et
          de recevoir des réponses officielles de l'administration sans avoir à vous déplacer. Il assure transparence,
          rapidité et efficacité dans le traitement de vos demandes.
        </p>
        
        <h2 className="text-lg font-semibold mt-4">Étapes pour soumettre une réclamation ou une demande d'information</h2>
        <ul className="list-disc list-inside mt-2">
          <li>Accédez à la section "Nouvelle Demande" dans le menu.</li>
          <li>Votre <strong>département</strong> est déjà attribué et affiché automatiquement.</li>
          <li>Choisissez entre une <strong>Réclamation</strong> ou une <strong>Demande d'information</strong>.</li>
          <li>Si vous soumettez une réclamation, le <strong>ministère</strong> concerné sera renseigné selon votre dossier.</li>
          <li>Remplissez les informations requises avec une description détaillée et ajoutez des documents justificatifs si nécessaire.</li>
          <li>Soumettez votre demande et téléchargez votre réclamation en PDF.</li>
        </ul>
        
        <h2 className="text-lg font-semibold mt-4">Suivi de votre réclamation</h2>
        <p className="text-red-600 font-bold">⚠️ Important : Après avoir soumis une réclamation, vous devez suivre son état d'avancement dans l'onglet "Suivi des demandes" du menu.</p>
        <ul className="list-disc list-inside mt-2">
          <li>Consultez régulièrement l'onglet "Suivi des demandes" pour voir l'état de votre réclamation.</li>
          <li>Les statuts possibles sont :
          <ul className="ml-4">
              <li className="text-orange-500">🟠 En attente - Votre demande a été reçue et sera examinée prochainement.</li>
              <li className="text-yellow-500">🟡 En cours de traitement - Votre réclamation est actuellement en cours d'analyse.</li>
              <li className="text-green-500">🟢 Résolue - Votre réclamation a été traitée avec succès.</li>
              <li className="text-red-500">🔴 Rejetée - Votre réclamation n'a pas été acceptée, consultez les détails pour plus d'informations.</li>
            </ul>
          </li>
          <li>Si des informations supplémentaires sont nécessaires, un message s'affichera en rouge avec les détails demandés.</li>
          <li>En cas de nécessité, vous pouvez joindre un document PDF supplémentaire.</li>
          <li>Une fois la réclamation traitée, un retour vous sera envoyé.</li>
        </ul>

        <h2 className="text-lg font-semibold mt-4">Guide utilisateur pour le département {department || "N/A"}</h2>
        <ul className="list-disc list-inside mt-2">
          <li>Votre demande est d'abord reçue par un <strong>guichetier</strong> du département.</li>
          <li>Le guichetier analyse votre dossier et l'oriente vers un <strong>employé</strong> compétent.</li>
          <li>Si un entretien est nécessaire, un <strong>rendez-vous</strong> sera planifié via la plateforme.</li>
          <li>Rédigez une <strong>description claire et précise</strong> en indiquant toutes les informations pertinentes (dates, références, personnes concernées, etc.).</li>
          <li>Ajoutez un fichier PDF si vous avez des justificatifs à fournir.</li>
          <li>Le traitement de votre demande dépend du <strong>ministère</strong> concerné, assurez-vous d'avoir toutes les pièces requises.</li>
          <li>Un retour vous sera envoyé une fois la réclamation traitée, et vous pourrez répondre si besoin.</li>
        </ul>
      </div>
    </div>
  );
}
