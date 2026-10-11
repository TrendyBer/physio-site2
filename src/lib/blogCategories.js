// src/lib/blogCategories.js
// Οι κατηγορίες των άρθρων αποθηκεύονται στη βάση με αγγλικά ονόματα.
// Εδώ μεταφράζονται για την ελληνική εμφάνιση. Κατηγορία που δεν
// υπάρχει εδώ εμφανίζεται όπως είναι γραμμένη.

const EL = {
  'Pain Management': 'Διαχείριση πόνου',
  'Mobility & Balance': 'Κινητικότητα & ισορροπία',
  'Post-Surgery': 'Μετεγχειρητική αποκατάσταση',
  'Recovery Tips': 'Συμβουλές αποκατάστασης',
  'Sports Injuries': 'Αθλητικές κακώσεις',
};

export function categoryLabel(cat, lang) {
  if (!cat) return '';
  return lang === 'en' ? cat : (EL[cat] || cat);
}
