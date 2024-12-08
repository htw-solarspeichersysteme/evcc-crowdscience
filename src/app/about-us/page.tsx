const FaqItems = [
  { id: 0, titel: "erstens", content: "ananas" },
  { id: 1, titel: "zweitens", content: "banane" },
  { id: 2, titel: "drittens", content: "clementine" },
];

export default function FaqList() {
  return FaqItems.map((item, index) => {
    return <li key={index}>{item.content}</li>;
  });
}
//versuche in datentypen zudenken
//speicher faq texte in nem array und gib die über loop aus
//react rendering lists
//accordion
