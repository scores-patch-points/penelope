# Composed English beside the plain baseline — heldout window

The composer's prose is frames (a closed word set) around Russian quotations and names copied from the text, plus kin terms and English names copied from giver rows. It is annotation of a recorded derivation, not translation. Each composed sentence is followed by the addresses it is bound to (Russian byte spans `ru#a-b`, giver rows, the record).

## Q1 [T-KIN] Which people in this text are Пьер's kin, and how?
- **plain baseline:** not in the context
- **composer** (checker: all sentences pass):
  - The text states no parent, child, sibling, or spouse of «Пьер».  
    `kin-lexicon@693f2377:key:atoms/parent  kin-lexicon@693f2377:key:atoms/child  kin-lexicon@693f2377:key:atoms/sibling  kin-lexicon@693f2377:key:atoms/spouse  ru#131-139  ru#0-73890`
  - Kin words in the text with an unbound end: 57.  
    `val:count(kin/unbound)  ru#0-73890`

## Q2 [C-ABSENT] Who is Фёдор Ростопчин in this text?
- **plain baseline:** not in the context
- **composer** (checker: all sentences pass):
  - The reading of the text has no being written «Фёдор Ростопчин».  
    `q:Q2#7-22  ru#0-73890`

## Q3 [T-KIN] Which people in this text are Анны Павловны's kin, and how?
- **plain baseline:** not in the context
- **composer** (checker: all sentences pass):
  - The text states no parent, child, sibling, or spouse of «Анны Павловны».  
    `kin-lexicon@693f2377:key:atoms/parent  kin-lexicon@693f2377:key:atoms/child  kin-lexicon@693f2377:key:atoms/sibling  kin-lexicon@693f2377:key:atoms/spouse  ru#12497-12522  ru#0-73890`
  - Kin words in the text with an unbound end: 57.  
    `val:count(kin/unbound)  ru#0-73890`

## Q4 [T-ID] Who is Долохов in this text?
- **plain baseline:** Долохов: written beside Анатолем, Стивенсом, Пьер, Курагин, Петербурга, Анна in the quoted sentences
- **composer** (checker: all sentences pass):
  - The text states no parent, child, sibling, or spouse of «Долохов».  
    `kin-lexicon@693f2377:key:atoms/parent  kin-lexicon@693f2377:key:atoms/child  kin-lexicon@693f2377:key:atoms/sibling  kin-lexicon@693f2377:key:atoms/spouse  ru#37283-37297  ru#0-73890`
  - Kin words in the text with an unbound end: 57.  
    `val:count(kin/unbound)  ru#0-73890`

## Q5 [T-ID] Who is Князь Ипполит in this text?
- **plain baseline:** Князь Ипполит: written as «Князь Ипполит», «Ипполитом», «князь Ипполит», «Ипполит»; written beside Андрей, Пьер, Анной, Павловной in the quoted sentences
- **composer** (checker: all sentences pass):
  - «Князь Ипполит» is also written «Ипполитом», «князь Ипполит», «Ипполит», and «Ипполиту».  
    `ru#2323-2348  ru#2256-2274  ru#4077-4102  ru#2334-2348  ru#6180-6196`
  - The aligned edition gives Hippolyte for «Князь Ипполит» (candidate).  
    `parallel-names@ba95430b:val:rows/7/english  ru#2323-2348  parallel-names@ba95430b:val:rows/7/standing`
  - No parent, child, sibling, or spouse of «Князь Ипполит» is stated by the text.  
    `kin-lexicon@693f2377:key:atoms/parent  kin-lexicon@693f2377:key:atoms/child  kin-lexicon@693f2377:key:atoms/sibling  kin-lexicon@693f2377:key:atoms/spouse  ru#2323-2348  ru#0-73890`
  - Kin words in the text with an unbound end: 57.  
    `val:count(kin/unbound)  ru#0-73890`

## Q6 [T-KIN] Which people in this text are Долохов's kin, and how?
- **plain baseline:** not in the context
- **composer** (checker: all sentences pass):
  - The text states no parent, child, sibling, or spouse of «Долохов».  
    `kin-lexicon@693f2377:key:atoms/parent  kin-lexicon@693f2377:key:atoms/child  kin-lexicon@693f2377:key:atoms/sibling  kin-lexicon@693f2377:key:atoms/spouse  ru#37283-37297  ru#0-73890`
  - Kin words in the text with an unbound end: 57.  
    `val:count(kin/unbound)  ru#0-73890`

## Q7 [T-SPEECH] Whom does князь Андрей speak to in this text?
- **plain baseline:** the window types no speech relation; written beside князь Андрей in its quoted sentences: Пьер, Ипполитом, Шерер, Записки, Цезаря, Анны
- **composer:** not composed — no_record_for_question_kind (T-SPEECH)

## Q8 [C-UNCLE] Who is the uncle of Долохов in this text?
- **plain baseline:** not in the context
- **composer** (checker: all sentences pass):
  - No uncle of «Долохов» is derived.  
    `kin-lexicon@693f2377:key:composites/uncle  ru#37283-37297  ru#0-73890`
  - The text states no parent of «Долохов».  
    `kin-lexicon@693f2377:key:atoms/parent  ru#37283-37297  ru#0-73890`

## Q9 [C-ABSENT] Who is Адам Чарторижский in this text?
- **plain baseline:** not in the context
- **composer** (checker: all sentences pass):
  - The reading of the text has no being written «Адам Чарторижский».  
    `q:Q9#7-24  ru#0-73890`

## Q10 [T-SPEECH] Whom does Долохов speak to in this text?
- **plain baseline:** the window types no speech relation; written beside Долохов in its quoted sentences: Анатолем, Стивенсом, Пьер, Курагин, Петербурга, Анна
- **composer:** not composed — no_record_for_question_kind (T-SPEECH)

## Q11 [C-UNCLE] Who is the uncle of Пьер in this text?
- **plain baseline:** not in the context
- **composer** (checker: all sentences pass):
  - No uncle of «Пьер» is derived.  
    `kin-lexicon@693f2377:key:composites/uncle  ru#131-139  ru#0-73890`
  - The text states no parent of «Пьер».  
    `kin-lexicon@693f2377:key:atoms/parent  ru#131-139  ru#0-73890`

## Q12 [T-SPEECH] Whom does Анатоль speak to in this text?
- **plain baseline:** the window types no speech relation; written beside Анатоль in its quoted sentences: Пьер, Долохов, Андрея, Василия, Стивенсом, Безухова
- **composer:** not composed — no_record_for_question_kind (T-SPEECH)

## Q13 [T-SPEECH] Whom does Анны Павловны speak to in this text?
- **plain baseline:** the window types no speech relation; written beside Анны Павловны in its quoted sentences: Андрея, Москву, Лизой, Михайловны, Анатолем, Борисе
- **composer:** not composed — no_record_for_question_kind (T-SPEECH)

## Q14 [T-KIN] Which people in this text are князь Андрей's kin, and how?
- **plain baseline:** not in the context
- **composer** (checker: all sentences pass):
  - The text states no parent, child, sibling, or spouse of «князь Андрей».  
    `kin-lexicon@693f2377:key:atoms/parent  kin-lexicon@693f2377:key:atoms/child  kin-lexicon@693f2377:key:atoms/sibling  kin-lexicon@693f2377:key:atoms/spouse  ru#6124-6147  ru#0-73890`
  - Kin words in the text with an unbound end: 57.  
    `val:count(kin/unbound)  ru#0-73890`

## Q15 [T-SPEECH] Whom does Князь Ипполит speak to in this text?
- **plain baseline:** the window types no speech relation; written beside Князь Ипполит in its quoted sentences: Андрей, Пьер, Анной, Павловной
- **composer:** not composed — no_record_for_question_kind (T-SPEECH)

## Q16 [T-SPEECH] Whom does Пьер speak to in this text?
- **plain baseline:** the window types no speech relation; written beside Пьер in its quoted sentences: Андрей, Павловну, Анну, Ипполиту, Записки, Цезаря
- **composer:** not composed — no_record_for_question_kind (T-SPEECH)

## Q17 [C-UNCLE] Who is the uncle of князь Андрей in this text?
- **plain baseline:** not in the context
- **composer** (checker: all sentences pass):
  - No uncle of «князь Андрей» is derived.  
    `kin-lexicon@693f2377:key:composites/uncle  ru#6124-6147  ru#0-73890`
  - The text states no parent of «князь Андрей».  
    `kin-lexicon@693f2377:key:atoms/parent  ru#6124-6147  ru#0-73890`

## Q18 [C-ABSENT] Who is Алексей Аракчеев in this text?
- **plain baseline:** not in the context
- **composer** (checker: all sentences pass):
  - The reading of the text has no being written «Алексей Аракчеев».  
    `q:Q18#7-23  ru#0-73890`

## Q19 [T-KIN] Which people in this text are Князь Ипполит's kin, and how?
- **plain baseline:** not in the context
- **composer** (checker: all sentences pass):
  - The text states no parent, child, sibling, or spouse of «Князь Ипполит».  
    `kin-lexicon@693f2377:key:atoms/parent  kin-lexicon@693f2377:key:atoms/child  kin-lexicon@693f2377:key:atoms/sibling  kin-lexicon@693f2377:key:atoms/spouse  ru#2323-2348  ru#0-73890`
  - Kin words in the text with an unbound end: 57.  
    `val:count(kin/unbound)  ru#0-73890`

## Q20 [T-ID] Who is Анны Павловны in this text?
- **plain baseline:** Анны Павловны: written as «Анны Павловны», «Анна Павловна», «Шерер», «Анны Павловны Шерер»; written beside Андрея, Москву, Лизой, Михайловны, Анатолем, Борисе in the quoted sentences; female
- **composer** (checker: all sentences pass):
  - «Анны Павловны» is also written «Анна Павловна», «Шерер», and «Анны Павловны Шерер».  
    `ru#12497-12522  ru#1104-1129  ru#7842-7852  ru#59043-59079`
  - «Анны Павловны» is female (name-parts-ru, candidate).  
    `ru#12497-12522  kin-lexicon@693f2377:val:atoms/mother/sex  fold:kin/facts/3/giver  fold:kin/facts/3/standing`
  - The text states no parent, child, sibling, or spouse of «Анны Павловны».  
    `kin-lexicon@693f2377:key:atoms/parent  kin-lexicon@693f2377:key:atoms/child  kin-lexicon@693f2377:key:atoms/sibling  kin-lexicon@693f2377:key:atoms/spouse  ru#12497-12522  ru#0-73890`
  - Kin words in the text with an unbound end: 57.  
    `val:count(kin/unbound)  ru#0-73890`

## Q21 [T-ID] Who is Пьер in this text?
- **plain baseline:** Пьер: written as «Пьер», «Пьера», «Пьеру», «Пьер сел»; written beside Андрей, Павловну, Анну, Ипполиту, Записки, Цезаря in the quoted sentences
- **composer** (checker: all sentences pass):
  - «Пьер» is also written «Пьера», «Пьеру», «Пьер сел», and «Пьере».  
    `ru#131-139  ru#11132-11142  ru#34803-34813  ru#9041-9056  ru#17063-17073`
  - The aligned edition gives Pierre for «Пьер» (candidate).  
    `parallel-names@ba95430b:val:rows/12/english  ru#131-139  parallel-names@ba95430b:val:rows/12/standing`
  - No parent, child, sibling, or spouse of «Пьер» is stated by the text.  
    `kin-lexicon@693f2377:key:atoms/parent  kin-lexicon@693f2377:key:atoms/child  kin-lexicon@693f2377:key:atoms/sibling  kin-lexicon@693f2377:key:atoms/spouse  ru#131-139  ru#0-73890`
  - Kin words in the text with an unbound end: 57.  
    `val:count(kin/unbound)  ru#0-73890`

## Q22 [T-KIN] Which people in this text are Анатоль's kin, and how?
- **plain baseline:** not in the context
- **composer** (checker: all sentences pass):
  - The text states no parent, child, sibling, or spouse of «Анатоль».  
    `kin-lexicon@693f2377:key:atoms/parent  kin-lexicon@693f2377:key:atoms/child  kin-lexicon@693f2377:key:atoms/sibling  kin-lexicon@693f2377:key:atoms/spouse  ru#34992-35006  ru#0-73890`
  - Kin words in the text with an unbound end: 57.  
    `val:count(kin/unbound)  ru#0-73890`

## Q23 [T-ID] Who is Анатоль in this text?
- **plain baseline:** Анатоль: written as «Анатоль», «Анатоля», «Анатоля Курагина», «Анатолю»; written beside Пьер, Долохов, Андрея, Василия, Стивенсом, Безухова in the quoted sentences
- **composer** (checker: all sentences pass):
  - «Анатоль» is also written «Анатоля», «Анатоля Курагина», and «Анатолю».  
    `ru#34992-35006  ru#31647-31661  ru#32993-33024  ru#34095-34109`
  - The aligned edition gives Anatole for «Анатоль» (candidate).  
    `parallel-names@ba95430b:val:rows/6/english  ru#34992-35006  parallel-names@ba95430b:val:rows/6/standing`
  - No parent, child, sibling, or spouse of «Анатоль» is stated by the text.  
    `kin-lexicon@693f2377:key:atoms/parent  kin-lexicon@693f2377:key:atoms/child  kin-lexicon@693f2377:key:atoms/sibling  kin-lexicon@693f2377:key:atoms/spouse  ru#34992-35006  ru#0-73890`
  - Kin words in the text with an unbound end: 57.  
    `val:count(kin/unbound)  ru#0-73890`

## Q24 [T-ID] Who is князь Андрей in this text?
- **plain baseline:** князь Андрей: written as «князь Андрей», «Князь Андрей», «Андрея», «князю Андрею»; written beside Пьер, Ипполитом, Шерер, Записки, Цезаря, Анны in the quoted sentences
- **composer** (checker: all sentences pass):
  - «князь Андрей» is also written «Князь Андрей», «Андрея», «князю Андрею», «Андрее», and «Андрей».  
    `ru#6124-6147  ru#2007-2030  ru#5154-5166  ru#8189-8212  ru#28875-28887  ru#2018-2030`
  - The aligned edition gives Andrew for «князь Андрей» (candidate).  
    `parallel-names@ba95430b:val:rows/13/english  ru#6124-6147  parallel-names@ba95430b:val:rows/13/standing`
  - No parent, child, sibling, or spouse of «князь Андрей» is stated by the text.  
    `kin-lexicon@693f2377:key:atoms/parent  kin-lexicon@693f2377:key:atoms/child  kin-lexicon@693f2377:key:atoms/sibling  kin-lexicon@693f2377:key:atoms/spouse  ru#6124-6147  ru#0-73890`
  - Kin words in the text with an unbound end: 57.  
    `val:count(kin/unbound)  ru#0-73890`

