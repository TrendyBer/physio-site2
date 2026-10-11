'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchPublicSettings } from '@/lib/publicSettings';

// Φορέας: Κυριακόπουλος Νικόλαος, ατομική επιχείρηση (Ναύπλιο).
// Συνιστάται έλεγχος από νομικό.
//
// ΤΑ ΠΟΣΑ ΔΕΝ ΕΙΝΑΙ ΓΡΑΜΜΕΝΑ ΣΤΟΝ ΚΩΔΙΚΑ.
// Διαβάζονται από platform_settings και subscription_plans, ώστε οι όροι
// να μη λένε ποτέ διαφορετικό νούμερο από την πραγματική τιμολόγηση.

const DEFAULT_FEE = 10;
const DEFAULT_RESET_MONTHS = 12;

function buildContent({ fee, resetMonths, plans, graceDays }) {
  const planLinesEl = plans.length > 0
    ? plans.map(p => {
        const price = Number(p.price_monthly || 0);
        return `${p.name_el}: ${price === 0 ? 'χωρίς μηνιαία χρέωση' : `${price}€ τον μήνα`} — τέλος νέου ασθενή ${Number(p.first_session_fee)}€`;
      })
    : [`Τα διαθέσιμα πακέτα και οι τιμές τους εμφανίζονται κατά την εγγραφή και στον πίνακα του θεραπευτή.`];

  const planLinesEn = plans.length > 0
    ? plans.map(p => {
        const price = Number(p.price_monthly || 0);
        return `${p.name_en || p.name_el}: ${price === 0 ? 'no monthly charge' : `€${price} per month`} — new-patient fee €${Number(p.first_session_fee)}`;
      })
    : [`Available plans and their prices are shown during registration and in the therapist dashboard.`];

  return {
    el: {
      title: 'Όροι Χρήσης',
      lastUpdated: 'Τελευταία ενημέρωση: 11 Οκτωβρίου 2026',
      intro: 'Καλώς ήρθατε στο Theralivo. Οι παρόντες Όροι Χρήσης διέπουν τη χρήση της πλατφόρμας. Με την εγγραφή και χρήση της Πλατφόρμας, αποδέχεστε τους παρόντες όρους.',
      sections: [
        {
          h: '1. Γενικά Στοιχεία',
          p: [
            'Εμπορική ονομασία: Theralivo.',
            'Φορέας λειτουργίας: Κυριακόπουλος Νικόλαος, ατομική επιχείρηση με έδρα στο Ναύπλιο, Ελλάδα.',
            'ΑΦΜ: 162062625 · ΔΟΥ: Ναυπλίου',
            'Επικοινωνία: info@theralivo.com',
            'Η Theralivo (εφεξής "η Πλατφόρμα") είναι μια διαδικτυακή πλατφόρμα που συνδέει ασθενείς με αδειούχους φυσικοθεραπευτές για συνεδρίες στον χώρο του ασθενή, σε Αθήνα και Αττική.',
          ],
        },
        {
          h: '2. Φύση της Υπηρεσίας',
          p: [
            'Η Πλατφόρμα λειτουργεί ως marketplace και διαμεσολαβητής. Δεν παρέχει η ίδια υπηρεσίες υγείας. Οι θεραπευτές που εγγράφονται είναι ανεξάρτητοι επαγγελματίες, υπεύθυνοι για την ποιότητα και νομιμότητα των υπηρεσιών τους.',
            'Η Πλατφόρμα δεν εγγυάται συγκεκριμένα θεραπευτικά αποτελέσματα.',
          ],
        },
        {
          h: '3. Εγγραφή και Λογαριασμός',
          list: [
            'Πρέπει να είστε τουλάχιστον 18 ετών για εγγραφή',
            'Παρέχετε ακριβή και ενημερωμένα στοιχεία',
            'Είστε υπεύθυνοι για την ασφάλεια του κωδικού σας',
            'Ένας λογαριασμός ανά άτομο',
            'Διατηρούμε το δικαίωμα αναστολής ή διαγραφής λογαριασμών που παραβαίνουν τους όρους',
          ],
        },
        {
          h: '4. Όροι για Ασθενείς',
          p: ['Η τιμή που βλέπετε είναι η τιμή που πληρώνετε. Η αμοιβή ορίζεται από τον κάθε θεραπευτή και εμφανίζεται πριν την κράτηση.'],
          list: [
            'Παρέχετε ειλικρινείς πληροφορίες για το πρόβλημα υγείας σας',
            'Η συμμετοχή σας σε θεραπεία είναι εθελοντική και υπ\' ευθύνη σας',
            'Πληρώνετε την αμοιβή της συνεδρίας απευθείας στον θεραπευτή. Η Πλατφόρμα δεν εισπράττει και δεν παρακρατεί μέρος της',
            'Οι χρεώσεις της Πλατφόρμας βαρύνουν τον θεραπευτή και δεν προστίθενται στην τιμή σας',
            'Όταν ο θεραπευτής δηλώσει ότι μια συνεδρία ολοκληρώθηκε, σας ζητάμε να επιβεβαιώσετε από τον λογαριασμό σας αν πράγματι έγινε. Αν δεν απαντήσετε εντός 7 ημερών, θεωρείται ότι έγινε. Αν δηλώσετε ότι δεν έγινε, η ομάδα της Πλατφόρμας επικοινωνεί μαζί σας',
            'Ακύρωση ραντεβού: ελεύθερη μέσα από τον λογαριασμό σας. Επαναλαμβανόμενες ακυρώσεις λιγότερο από 24 ώρες πριν καταγράφονται και μπορεί να οδηγήσουν σε προσωρινό περιορισμό κρατήσεων',
            'Δεν επιβάλλεται χρηματικό πρόστιμο ακύρωσης στην παρούσα φάση λειτουργίας',
          ],
        },
        {
          h: '5. Όροι για Θεραπευτές',
          p: ['Για να εγγραφείτε ως θεραπευτής, πρέπει να:'],
          list: [
            'Διαθέτετε εν ισχύι άδεια ασκήσεως επαγγέλματος φυσικοθεραπευτή',
            'Ανεβάσετε αντίγραφο της άδειας προς έλεγχο πριν εμφανιστείτε δημόσια',
            'Παρέχετε ακριβή στοιχεία για την ειδικότητα και εμπειρία σας',
            'Τηρείτε τα ραντεβού που έχετε αποδεχθεί',
            'Απαντάτε σε νέα αιτήματα εντός του χρόνου που ορίζει η Πλατφόρμα',
            'Παρέχετε υπηρεσίες σύμφωνα με τα επαγγελματικά πρότυπα',
            'Συμμορφώνεστε με τη νομοθεσία περί υγείας και τον GDPR',
          ],
          p2: ['Ο λογαριασμός σας εμφανίζεται δημόσια μόνο αφού ελεγχθεί η άδειά σας και συμπληρωθούν τα υποχρεωτικά στοιχεία του προφίλ σας.'],
        },
        {
          h: '6. Συνδρομή Θεραπευτών',
          p: ['Η συνεργασία με την Πλατφόρμα προϋποθέτει την επιλογή πακέτου συνδρομής κατά την εγγραφή.'],
          list: planLinesEl,
          p2: [
            'Οι τιμές κλειδώνονται τη στιγμή της εγγραφής ή της αλλαγής πακέτου. Μελλοντικές αυξήσεις δεν επηρεάζουν υφιστάμενες συνδρομές, εκτός αν ο θεραπευτής επιλέξει ο ίδιος να αλλάξει πακέτο.',
            'Η μηνιαία συνδρομή πληρώνεται με κάρτα μέσω του παρόχου πληρωμών Stripe. Η πρώτη πληρωμή γίνεται μετά την έγκριση του προφίλ· μέχρι τότε δεν υπάρχει καμία χρέωση. Το πακέτο και η δημόσια εμφάνιση του προφίλ ενεργοποιούνται με την ολοκλήρωση της πληρωμής.',
            'Η συνδρομή ανανεώνεται αυτόματα κάθε μήνα, με χρέωση της ίδιας κάρτας, μέχρι ο θεραπευτής να επιλέξει το δωρεάν πακέτο από τον πίνακά του. Η διακοπή ισχύει από το τέλος του μήνα που έχει ήδη πληρωθεί· για τον τρέχοντα μήνα δεν γίνεται επιστροφή. Αν μια μηνιαία χρέωση αποτύχει, γίνονται αυτόματα νέες προσπάθειες· αν δεν πετύχουν, ο θεραπευτής περνά αυτόματα στο δωρεάν πακέτο, χωρίς να χάσει τον λογαριασμό του.',
            'Η αλλαγή πακέτου γίνεται οποτεδήποτε από τον πίνακα του θεραπευτή. Το νέο πληρωμένο πακέτο ενεργοποιείται μόλις ολοκληρωθεί η πληρωμή του πρώτου μήνα του, και τότε σταματά η χρέωση του προηγούμενου· μέχρι τότε παραμένει ενεργό το τρέχον.',
            `Σε περίπτωση μη εξόφλησης, παρέχεται περίοδος χάριτος ${graceDays} ημερών. Μετά την πάροδό της, η Πλατφόρμα δύναται να αναστείλει την αποστολή νέων αιτημάτων ή την προβολή του προφίλ, χωρίς να θίγονται τα ήδη προγραμματισμένα ραντεβού.`,
            'Η Πλατφόρμα δύναται να απαλλάξει συγκεκριμένους θεραπευτές από τη συνδρομή ή την προμήθεια κατά την κρίση της.',
          ],
        },
        {
          h: '7. Τέλος Νέου Ασθενή',
          p: ['Πέραν της συνδρομής, η Πλατφόρμα χρεώνει εφάπαξ τέλος για κάθε νέο ασθενή που αποκτά ο θεραπευτής μέσω αυτής.'],
          list: [
            'Το ποσό εξαρτάται από το πακέτο συνδρομής και εμφανίζεται στον πίνακα του θεραπευτή πριν την αποδοχή κάθε αιτήματος',
            'Το τέλος πληρώνεται με κάρτα, μέσω Stripe, τη στιγμή που ο θεραπευτής αποδέχεται το αίτημα. Η αποδοχή ολοκληρώνεται μόλις επιβεβαιωθεί η πληρωμή',
            'Αν η αποδοχή δεν μπορέσει να ολοκληρωθεί (π.χ. επειδή έληξε η προθεσμία απάντησης ή το αίτημα ακυρώθηκε στο μεταξύ), το ποσό επιστρέφεται αυτόματα στο σύνολό του',
            'Χρεώνεται ΜΙΑ φορά ανά ασθενή. Για όλες τις επόμενες συνεδρίες με τον ίδιο ασθενή δεν υπάρχει καμία χρέωση',
            `Εάν ασθενής επιστρέψει στον ίδιο θεραπευτή μετά από ${resetMonths} μήνες χωρίς καμία συνεδρία, θεωρείται νέος ασθενής`,
            'Ο ασθενής δεν επιβαρύνεται με κανένα επιπλέον ποσό',
          ],
        },
        {
          h: '8. Πολιτική Anti-Bypass',
          p: ['Το μοντέλο της Πλατφόρμας στηρίζεται στο ότι χρεώνει μόνο την πρώτη επαφή. Η καταστρατήγησή του θίγει άμεσα τη βιωσιμότητά της.'],
          list: [
            'Απαγορεύεται αυστηρά η εκτός Πλατφόρμας συμφωνία με ασθενείς που γνωρίσατε μέσω αυτής',
            'Όλες οι κρατήσεις πρέπει να καταχωρούνται μέσω της Πλατφόρμας',
            'Σε περίπτωση αποδεδειγμένης παραβίασης: πρόστιμο έως 500€ ανά περιστατικό και οριστική αποβολή',
            'Η υποχρέωση αυτή ισχύει για δώδεκα (12) μήνες από την τελευταία συνεδρία με τον εκάστοτε ασθενή',
          ],
        },
        {
          h: '9. Πληρωμές',
          list: [
            'Η αμοιβή της συνεδρίας καταβάλλεται από τον ασθενή απευθείας στον θεραπευτή. Η Πλατφόρμα δεν εισπράττει και δεν παρακρατεί μέρος της',
            'Η συνδρομή και το τέλος νέου ασθενή πληρώνονται από τον θεραπευτή με κάρτα μέσω Stripe. Τα στοιχεία της κάρτας τα διαχειρίζεται η Stripe· η Πλατφόρμα δεν τα αποθηκεύει',
            'Για κάθε χρέωση εκδίδεται το αντίστοιχο παραστατικό',
            'Ο θεραπευτής βλέπει ανά πάσα στιγμή τις χρεώσεις του στον πίνακά του',
          ],
          p2: ['Το τέλος νέου ασθενή επιστρέφεται αυτόματα όταν η αποδοχή δεν ολοκληρωθεί. Κάθε άλλο αίτημα επιστροφής εξετάζεται μεμονωμένα στο info@theralivo.com.'],
        },
        {
          h: '10. Ακυρώσεις',
          list: [
            'Ακύρωση από τον ασθενή ή τον θεραπευτή γίνεται μέσα από τον λογαριασμό του καθενός',
            'Ακύρωση λιγότερο από 24 ώρες πριν το ραντεβού καταγράφεται ως σημείωση στο ιστορικό',
            'Τρεις τέτοιες καταγραφές οδηγούν σε προσωρινό πάγωμα της δυνατότητας κρατήσεων',
            'Δεν επιβάλλεται χρηματικό πρόστιμο ακύρωσης στην παρούσα φάση',
            'Εάν ακυρώσει ο θεραπευτής, το αίτημα ανατίθεται σε άλλον διαθέσιμο θεραπευτή χωρίς επιβάρυνση του ασθενή',
          ],
        },
        {
          h: '11. Κατάταξη και Προβολή',
          p: ['Θέλουμε να ξέρετε πώς προκύπτει η σειρά που βλέπετε.'],
          list: [
            'Πρώτα εμφανίζονται ΜΟΝΟ οι θεραπευτές που ταιριάζουν με τα κριτήριά σας (περιοχή, πάθηση, ειδικότητα και όσα άλλα φίλτρα επιλέξετε). Κανένα συνδρομητικό πακέτο δεν παρακάμπτει αυτά τα κριτήρια',
            'Ανάμεσα σε αυτούς, η προτεινόμενη σειρά προκύπτει από βαθμολογία που συνδυάζει τις αξιολογήσεις ασθενών, το συνδρομητικό πακέτο του θεραπευτή, τη διαθεσιμότητά του και την εμπειρία του στην Πλατφόρμα',
            'Θεραπευτές σε ανώτερα πακέτα αποκτούν πλεονέκτημα στην προτεινόμενη σειρά, χωρίς εγγύηση συγκεκριμένης θέσης. Θεραπευτής με καλύτερες αξιολογήσεις μπορεί να προηγείται θεραπευτή σε ανώτερο πακέτο',
            'Όταν επιλέγετε ρητή ταξινόμηση (βαθμολογία, τιμή, εμπειρία), το πακέτο συνδρομής ΔΕΝ επηρεάζει τη σειρά',
          ],
        },
        {
          h: '12. Αξιολογήσεις',
          list: [
            'Οι αξιολογήσεις πρέπει να βασίζονται σε πραγματική εμπειρία',
            'Απαγορεύονται οι ψευδείς, υβριστικές ή παραπλανητικές αξιολογήσεις',
            'Η Πλατφόρμα διατηρεί το δικαίωμα αφαίρεσης αξιολογήσεων που παραβιάζουν τους όρους',
            'Οι αξιολογήσεις είναι δημόσιες και εμφανίζονται με το μικρό όνομα του ασθενή',
            'Δεν αφαιρούμε αρνητικές αξιολογήσεις κατόπιν αιτήματος του θεραπευτή, εφόσον τηρούν τους όρους',
          ],
        },
        {
          h: '13. Απαγορευμένη Χρήση',
          p: ['Δεν επιτρέπεται:'],
          list: [
            'Παράνομες δραστηριότητες ή παραβίαση δικαιωμάτων τρίτων',
            'Αντιγραφή ή scraping του περιεχομένου',
            'Δοκιμές διείσδυσης χωρίς γραπτή άδεια',
            'Δημιουργία πολλαπλών λογαριασμών για παραπλάνηση',
            'Παρενόχληση άλλων χρηστών',
          ],
        },
        {
          h: '14. Ευθύνη και Αποζημίωση',
          p: [
            'Η Πλατφόρμα παρέχεται "ως έχει". Δεν εγγυόμαστε αδιάλειπτη λειτουργία ή ότι θα είναι απαλλαγμένη από σφάλματα.',
            'Δεν φέρουμε ευθύνη για:',
          ],
          list: [
            'Την ποιότητα ή το αποτέλεσμα των θεραπειών',
            'Διαφορές μεταξύ ασθενών και θεραπευτών',
            'Έμμεσες, τυχαίες ή επακόλουθες ζημίες',
          ],
          p2: ['Η συνολική ευθύνη μας περιορίζεται στο ποσό που έχετε καταβάλει στην Πλατφόρμα τους τελευταίους 12 μήνες. Ουδεμία διάταξη των παρόντων όρων περιορίζει δικαιώματα που σας παρέχει αναγκαστικού δικαίου η ελληνική ή ευρωπαϊκή νομοθεσία προστασίας καταναλωτή.'],
        },
        {
          h: '15. Τροποποίηση Όρων',
          p: [
            'Διατηρούμε το δικαίωμα τροποποίησης των όρων. Οι σημαντικές αλλαγές, περιλαμβανομένων των τιμών συνδρομής και προμήθειας, θα ανακοινώνονται με email τουλάχιστον 14 ημέρες πριν την εφαρμογή τους.',
            'Η αύξηση τιμών δεν επηρεάζει υφιστάμενες συνδρομές εντός της τρέχουσας περιόδου χρέωσης.',
            'Η συνεχιζόμενη χρήση της Πλατφόρμας μετά την τροποποίηση συνιστά αποδοχή.',
          ],
        },
        {
          h: '16. Λύση Διαφορών — Δικαιοδοσία',
          p: [
            'Πρώτα προσπάθεια: φιλικός διακανονισμός μέσω info@theralivo.com',
            'Καταναλωτές δύνανται επίσης να απευθυνθούν στον Συνήγορο του Καταναλωτή ή σε άλλο φορέα εναλλακτικής επίλυσης καταναλωτικών διαφορών.',
            'Σε περίπτωση μη επίλυσης: αρμόδια δικαστήρια Ναυπλίου, Ελλάδα, με την επιφύλαξη των δικαιωμάτων που έχουν οι καταναλωτές να προσφύγουν στα δικαστήρια του τόπου κατοικίας τους.',
            'Εφαρμοστέο δίκαιο: ελληνικό.',
          ],
        },
        {
          h: '17. Επικοινωνία',
          p: ['Για ερωτήσεις σχετικά με τους όρους: info@theralivo.com'],
        },
      ],
    },

    en: {
      title: 'Terms of Service',
      lastUpdated: 'Last updated: October 11, 2026',
      intro: 'Welcome to Theralivo. These Terms of Service govern your use of the platform. By registering and using the Platform, you accept these terms.',
      sections: [
        {
          h: '1. General Information',
          p: [
            'Trade name: Theralivo.',
            'Operated by: Nikolaos Kyriakopoulos, sole proprietorship based in Nafplio, Greece.',
            'Tax ID (ΑΦΜ): 162062625 · Tax Office: Nafplio',
            'Contact: info@theralivo.com',
            'Theralivo (the "Platform") is an online platform connecting patients with licensed physiotherapists for sessions at the patient\'s location in Athens and Attica.',
          ],
        },
        {
          h: '2. Nature of the Service',
          p: [
            'The Platform operates as a marketplace and intermediary. It does not provide healthcare services itself. Registered therapists are independent professionals responsible for the quality and legality of their services.',
            'The Platform does not guarantee specific therapeutic outcomes.',
          ],
        },
        {
          h: '3. Registration and Account',
          list: [
            'You must be at least 18 years old to register',
            'Provide accurate and updated information',
            'You are responsible for the security of your password',
            'One account per person',
            'We reserve the right to suspend or delete accounts that violate the terms',
          ],
        },
        {
          h: '4. Terms for Patients',
          p: ['The price you see is the price you pay. Fees are set by each therapist and shown before booking.'],
          list: [
            'Provide truthful information about your health condition',
            'Your participation in therapy is voluntary and at your own risk',
            'You pay the session fee directly to the therapist. The Platform does not collect or withhold any part of it',
            'Platform charges are borne by the therapist and are not added to your price',
            'When the therapist marks a session as completed, we ask you to confirm from your account whether it actually took place. If you do not answer within 7 days, it is considered done. If you report that it did not take place, the Platform team will contact you',
            'Cancellation: free through your account. Repeated cancellations less than 24 hours in advance are recorded and may lead to a temporary booking restriction',
            'No monetary cancellation penalty applies at this stage of operation',
          ],
        },
        {
          h: '5. Terms for Therapists',
          p: ['To register as a therapist, you must:'],
          list: [
            'Hold a valid physiotherapist license',
            'Upload a copy of the license for verification before appearing publicly',
            'Provide accurate specialty and experience information',
            'Honor accepted appointments',
            'Respond to new requests within the timeframe set by the Platform',
            'Provide services according to professional standards',
            'Comply with healthcare legislation and GDPR',
          ],
          p2: ['Your account becomes publicly visible only after your license is verified and the mandatory profile fields are completed.'],
        },
        {
          h: '6. Therapist Subscription',
          p: ['Working with the Platform requires selecting a subscription plan at registration.'],
          list: planLinesEn,
          p2: [
            'Prices are locked at the moment of registration or plan change. Future increases do not affect existing subscriptions unless the therapist chooses to change plans.',
            'The monthly subscription is paid by card through the payment provider Stripe. The first payment is made after the profile is approved; until then there is no charge. The plan and public profile visibility are activated once the payment is completed.',
            'The subscription renews automatically every month, charging the same card, until the therapist switches to the free plan from their dashboard. Stopping takes effect at the end of the month already paid; the current month is not refunded. If a monthly charge fails, it is retried automatically; if the retries fail, the therapist is moved automatically to the free plan without losing their account.',
            'Plans can be changed at any time from the therapist dashboard. A new paid plan is activated once its first month is paid, at which point charging for the previous plan stops; until then the current plan remains active.',
            `In case of non-payment, a grace period of ${graceDays} days applies. After it expires, the Platform may suspend new requests or profile visibility, without affecting already scheduled appointments.`,
            'The Platform may exempt specific therapists from the subscription or the fee at its discretion.',
          ],
        },
        {
          h: '7. New-Patient Fee',
          p: ['In addition to the subscription, the Platform charges a one-time fee for each new patient a therapist gains through it.'],
          list: [
            'The amount depends on the subscription plan and is shown in the therapist dashboard before each request is accepted',
            'The fee is paid by card, through Stripe, when the therapist accepts the request. The acceptance is completed once the payment is confirmed',
            'If the acceptance cannot be completed (e.g. because the response deadline passed or the request was cancelled in the meantime), the amount is refunded automatically in full',
            'It is charged ONCE per patient. There is no charge for any later session with the same patient',
            `If a patient returns to the same therapist after ${resetMonths} months without any session, they count as a new patient`,
            'Patients are not charged any additional amount',
          ],
        },
        {
          h: '8. Anti-Bypass Policy',
          p: ['The Platform model relies on charging only for the first introduction. Circumventing it directly harms its viability.'],
          list: [
            'Off-platform agreements with patients met through the Platform are strictly prohibited',
            'All bookings must be recorded through the Platform',
            'In case of proven violation: fine up to €500 per incident and permanent removal',
            'This obligation applies for twelve (12) months from the last session with each patient',
          ],
        },
        {
          h: '9. Payments',
          list: [
            'Session fees are paid by the patient directly to the therapist. The Platform does not collect or withhold any part of them',
            'The subscription and the new-patient fee are paid by the therapist by card through Stripe. Card details are handled by Stripe; the Platform does not store them',
            'A corresponding receipt or invoice is issued for every charge',
            'Therapists can see their charges at any time in their dashboard',
          ],
          p2: ['The new-patient fee is refunded automatically when an acceptance is not completed. Any other refund request is reviewed individually at info@theralivo.com.'],
        },
        {
          h: '10. Cancellations',
          list: [
            'Either party may cancel through their own account',
            'Cancellation less than 24 hours before the appointment is recorded in the history',
            'Three such records lead to a temporary freeze on booking ability',
            'No monetary cancellation penalty applies at this stage',
            'If the therapist cancels, the request is reassigned to another available therapist at no cost to the patient',
          ],
        },
        {
          h: '11. Ranking and Visibility',
          p: ['We want you to know how the order you see is produced.'],
          list: [
            'Only therapists who match your criteria (area, condition, specialty and any other filters you choose) are shown. No subscription plan overrides these criteria',
            'Among them, the recommended order comes from a score combining patient reviews, the therapist\'s subscription plan, availability and platform experience',
            'Therapists on higher plans gain an advantage in the recommended order, with no guarantee of a specific position. A therapist with better reviews may rank above one on a higher plan',
            'When you choose an explicit sort (rating, price, experience), the subscription plan does NOT affect the order',
          ],
        },
        {
          h: '12. Reviews',
          list: [
            'Reviews must be based on actual experience',
            'False, abusive, or misleading reviews are prohibited',
            'The Platform reserves the right to remove reviews that violate the terms',
            'Reviews are public and shown with the patient\'s first name',
            'We do not remove negative reviews at a therapist\'s request, provided they comply with the terms',
          ],
        },
        {
          h: '13. Prohibited Use',
          p: ['Not allowed:'],
          list: [
            'Illegal activities or violation of third-party rights',
            'Copying or scraping content',
            'Penetration testing without written permission',
            'Creating multiple accounts for deception',
            'Harassment of other users',
          ],
        },
        {
          h: '14. Liability and Indemnification',
          p: [
            'The Platform is provided "as is". We do not guarantee uninterrupted operation or error-free service.',
            'We are not liable for:',
          ],
          list: [
            'Quality or outcome of treatments',
            'Disputes between patients and therapists',
            'Indirect, incidental, or consequential damages',
          ],
          p2: ['Our total liability is limited to the amount you have paid to the Platform in the last 12 months. Nothing in these terms limits rights granted to you by mandatory Greek or European consumer protection law.'],
        },
        {
          h: '15. Modification of Terms',
          p: [
            'We reserve the right to modify the terms. Significant changes, including subscription and fee prices, will be announced via email at least 14 days before implementation.',
            'Price increases do not affect existing subscriptions within the current billing period.',
            'Continued use of the Platform after modification constitutes acceptance.',
          ],
        },
        {
          h: '16. Dispute Resolution — Jurisdiction',
          p: [
            'First attempt: amicable settlement via info@theralivo.com',
            'Consumers may also contact the Greek Consumer Ombudsman or another alternative consumer dispute resolution body.',
            'If unresolved: competent courts of Nafplio, Greece, without prejudice to consumers\' right to bring proceedings in the courts of their place of residence.',
            'Applicable law: Greek.',
          ],
        },
        {
          h: '17. Contact',
          p: ['For questions about the terms: info@theralivo.com'],
        },
      ],
    },
  };
}

export default function TermsOfServicePage() {
  const [lang, setLang] = useState('el');
  const [fee, setFee] = useState(DEFAULT_FEE);
  const [resetMonths, setResetMonths] = useState(DEFAULT_RESET_MONTHS);
  const [graceDays, setGraceDays] = useState(7);
  const [plans, setPlans] = useState([]);

  // Τα ποσά έρχονται από τη βάση. Αν αλλάξεις τιμή στο admin,
  // οι όροι ακολουθούν αυτόματα — ποτέ δεν λένε άλλο νούμερο.
  useEffect(() => {
    (async () => {
      const [{ data: cfg }, { data: planRows }] = await Promise.all([
        fetchPublicSettings(['first_session_fee_default', 'first_session_reset_months', 'subscription_grace_days']),
        supabase
          .from('subscription_plans')
          .select('name_el, name_en, price_monthly, first_session_fee, display_order')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
      ]);

      const map = {};
      (cfg || []).forEach(r => { map[r.key] = r.value; });

      if (Number(map.first_session_fee_default) > 0) setFee(Number(map.first_session_fee_default));
      if (parseInt(map.first_session_reset_months, 10) > 0) setResetMonths(parseInt(map.first_session_reset_months, 10));
      if (parseInt(map.subscription_grace_days, 10) >= 0) setGraceDays(parseInt(map.subscription_grace_days, 10));
      setPlans(planRows || []);
    })();
  }, []);

  const c = buildContent({ fee, resetMonths, plans, graceDays })[lang];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      <nav style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: '#1a2e44', textDecoration: 'none' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a6fdb', display: 'inline-block' }} />
          Theralivo
        </a>
        <a href="/" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}>← {lang === 'el' ? 'Επιστροφή' : 'Back'}</a>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', gap: 4, background: '#e2e8f0', padding: 4, borderRadius: 12, width: 'fit-content', marginBottom: 24 }}>
          {['el', 'en'].map(l => (
            <button key={l} onClick={() => setLang(l)}
              style={{ padding: '6px 18px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: lang === l ? '#fff' : 'transparent', color: lang === l ? '#0F172A' : '#64748B', textTransform: 'uppercase' }}>
              {l}
            </button>
          ))}
        </div>

        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#1a2e44', marginBottom: 8, fontFamily: 'Georgia, serif' }}>{c.title}</h1>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 32 }}>{c.lastUpdated}</p>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 24, marginBottom: 24, fontSize: 15, color: '#475569', lineHeight: 1.7 }}>
          {c.intro}
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '32px 28px' }}>
          {c.sections.map((s, i) => (
            <section key={i} style={{ marginBottom: i === c.sections.length - 1 ? 0 : 28 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a2e44', marginBottom: 12 }}>{s.h}</h2>
              {s.p && s.p.map((p, j) => (
                <p key={j} style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 8 }}>{p}</p>
              ))}
              {s.list && (
                <ul style={{ paddingLeft: 20, marginTop: 8, marginBottom: 8 }}>
                  {s.list.map((item, j) => (
                    <li key={j} style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 4 }}>{item}</li>
                  ))}
                </ul>
              )}
              {s.p2 && s.p2.map((p, j) => (
                <p key={j} style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginTop: 8 }}>{p}</p>
              ))}
            </section>
          ))}
        </div>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
          <a href="/privacy" style={{ color: '#2a6fdb', textDecoration: 'none', margin: '0 12px' }}>{lang === 'el' ? 'Πολιτική Απορρήτου' : 'Privacy Policy'}</a>
          •
          <a href="/cookies" style={{ color: '#2a6fdb', textDecoration: 'none', margin: '0 12px' }}>{lang === 'el' ? 'Πολιτική Cookies' : 'Cookie Policy'}</a>
        </div>
      </div>
    </div>
  );
}