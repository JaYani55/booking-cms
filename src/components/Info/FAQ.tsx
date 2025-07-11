import React, { useState, useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Search } from 'lucide-react';

const faqs = [
  {
    id: 1,
    question: 'Wie finde ich verfügbare Veranstaltungen?',
    answer:
      'Nach dem Login landest du in der Events-Übersicht. Dort siehst du alle bevorstehenden Veranstaltungen in einer Grid-Ansicht mit Tabs für alle Veranstaltungen, meine Veranstaltungen und das Archiv.',
  },
  {
    id: 2,
    question: 'Als MentorIn: Wie sende ich eine Anfrage?',
    answer:
      'In der Grid- oder Listenansicht klickst du entweder direkt auf “Anfrage als MentorIn” oder auf eine Veranstaltung, um zur Detailseite zu gelangen. Dort tippst du auf den Button „Anfrage als MentorIn“, um deine Mentoranfrage abzuschicken.',
  },
  {
    id: 3,
    question: 'Wie sehe ich meine gebuchten und angefragten Veranstaltungen?',
    answer:
      'Wechsle in der Events-Übersicht zum Tab „Meine Events“. Dort findest du getrennt deine bevorstehenden und deine vergangenen Veranstaltungen.',
  },
  {
    id: 4,
    question: 'Wie wechsle ich zur Kalenderansicht?',
    answer:
      'Wähle im Hauptmenü den Punkt „Kalender“ aus. In der Monatsansicht siehst du alle Veranstaltungen in einem Raster und kannst einzelne Tage anklicken, um Details anzuzeigen.',
  },
  {
    id: 5,
    question: 'Als MitarbeiterIn: Wie lege ich selbst eine neue Veranstaltung an?',
    answer:
      'Klicke oben rechts auf den Button „Neue Veranstaltung“. Du wirst zu einem Formular geführt, in dem du alle relevanten Felder ausfüllst und deine Veranstaltung erstellst.',
  },
  {
    id: 6,
    question: 'Wie bearbeite oder lösche ich eine Veranstaltung?',
    answer:
      'Auf der Detailseite einer Veranstaltung findest du die Buttons „Bearbeiten“ und „Löschen“.',
  },
  {
    id: 7,
    question: 'Wie bearbeite ich mein Profil?',
    answer:
      'Das ist derzeit dem Management vorbehalten, bitte wende dich dazu an die entsprechenden mentoring manager.',
  },
  {
    id: 8,
    question: 'Wie passe ich die App-Einstellungen an?',
    answer:
      'Im Bereich „Settings“ legst du deine bevorzugte Standardansicht (Grid oder Liste) fest. Die Einstellungen werden für deinen nächsten Besuch gespeichert. Weitere Einstellungen folgen.',
  },
  {
    id: 9,
    question: 'Wie gebe ich Feedback oder melde ich Bugs?',
    answer:
      'Rechts unten werden dir jederzeit die Buttons „Feedback“ und „Bug Report“ angezeigt. Mit einem Klick darauf öffnet sich jeweils ein Formular, das dein Anliegen direkt an uns sendet.',
  },
];

const FAQ = () => {
  const { language, theme } = useTheme();
  const [query, setQuery] = useState('');

  const filteredFaqs = useMemo(
    () =>
      faqs.filter(({ question, answer }) =>
        `${question} ${answer}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [query]
  );

  return (
    <>
      <h1
        id="faq-heading"
        className="text-4xl font-extrabold mb-6 text-center"
      >
        {language === 'en'
          ? 'Frequently Asked Questions'
          : 'Häufig gestellte Fragen'}
      </h1>

      {/* Search */}
      <div className="relative mb-8">
        <Search
          size={20}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={language === 'en' ? 'Search…' : 'Suche…'}
          aria-label={language === 'en' ? 'Search questions' : 'Fragen durchsuchen'}
          className={`
            w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors
            ${theme === 'dark'
              ? 'border-gray-700 bg-gray-800 placeholder-gray-400 text-gray-100 focus:border-blue-400 focus:ring-blue-500'
              : 'border-gray-300 bg-white placeholder-gray-500 text-gray-900 focus:border-blue-600 focus:ring-blue-600'}
          `}
        />
      </div>

      {/* FAQ List */}
      {filteredFaqs.length === 0 ? (
        <p className="text-center text-gray-500">
          {language === 'en' ? 'No results found.' : 'Keine Ergebnisse gefunden.'}
        </p>
      ) : (
        <div className="space-y-6">
          {filteredFaqs.map(({ id, question, answer }) => (
            <div
              key={id}
              className={`
                border rounded-lg p-5
                ${theme === 'dark'
                  ? 'bg-gray-800 border-gray-700 text-gray-100'
                  : 'bg-gray-100 border-gray-200 text-gray-900'}
              `}
            >
              <h2 className="text-lg font-semibold mb-2">{question}</h2>
              <p className="leading-relaxed">{answer}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default FAQ;
