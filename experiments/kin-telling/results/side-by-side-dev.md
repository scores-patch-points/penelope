# Composed English beside the plain baseline — dev window

The composer's prose is frames (a closed word set) around Russian quotations and names copied from the text, plus kin terms and English names copied from giver rows. It is annotation of a recorded derivation, not translation. Each composed sentence is followed by the addresses it is bound to (Russian byte spans `ru#a-b`, giver rows, the record).

## Q1 [T-KIN] Which people in this text are Анна Павловна's kin, and how?
- **plain baseline:** not in the context
- **composer** (checker: all sentences pass):
  - The text states no parent, child, sibling, or spouse of «Анна Павловна».  
    `kin-lexicon@693f2377:key:atoms/parent  kin-lexicon@693f2377:key:atoms/child  kin-lexicon@693f2377:key:atoms/sibling  kin-lexicon@693f2377:key:atoms/spouse  ru#693-718  ru#0-74460`
  - Kin words in the text with an unbound end: 35.  
    `val:count(kin/unbound)  ru#0-74460`

## Q2 [C-ABSENT] Who is Фёдор Долохов in this text?
- **plain baseline:** not in the context
- **composer** (checker: all sentences pass):
  - The reading of the text has no being written «Фёдор Долохов».  
    `q:Q2#7-20  ru#0-74460`

## Q3 [T-KIN] Which people in this text are Элен's kin, and how?
- **plain baseline:** Элен is the daughter of князь Василий (stated by the text)
- **composer** (checker: all sentences pass):
  - «князь Василий» is the parent of «Элен».  
    `ru#23456-23481  kin-lexicon@693f2377:key:atoms/parent  ru#17908-17916`
  - The text states «Элен, дочь князя Василия».  
    `ru#30488-30532`
  - Neither male nor female is stated for «князь Василий» by the text.  
    `kin-lexicon@693f2377:val:atoms/father/sex  kin-lexicon@693f2377:val:atoms/mother/sex  ru#23456-23481  ru#0-74460`
  - The text states no child, sibling, or spouse of «Элен».  
    `kin-lexicon@693f2377:key:atoms/child  kin-lexicon@693f2377:key:atoms/sibling  kin-lexicon@693f2377:key:atoms/spouse  ru#17908-17916  ru#0-74460`
  - Kin words in the text with an unbound end: 35.  
    `val:count(kin/unbound)  ru#0-74460`

## Q4 [T-ID] Who is князь Василий in this text?
- **plain baseline:** князь Василий: written as «Василия», «Князь Василий», «князь Василий», «Василию»; written beside Павловна, Анна, Болконская, Элен, Пьеру, Шерер in the quoted sentences; князь Ипполит is the son of князь Василий (stated by the text); Элен is the daughter of князь Василий (stated by the text)
- **composer** (checker: all sentences pass):
  - «князь Василий» is also written «Василия», «Князь Василий», and «Василию».  
    `ru#23456-23481  ru#897-911  ru#4301-4326  ru#23226-23240`
  - The aligned edition gives Vasili for «князь Василий» (candidate).  
    `parallel-names@ba95430b:val:rows/2/english  ru#23456-23481  parallel-names@ba95430b:val:rows/2/standing`
  - «князь Ипполит» is the son of «князь Василий».  
    `ru#18530-18555  kin-lexicon@693f2377:key:atoms/son  ru#23456-23481`
  - «Элен» is the daughter of «князь Василий».  
    `ru#17908-17916  kin-lexicon@693f2377:key:atoms/daughter  ru#23456-23481`
  - The text states «Ипполит, сын князя Василия».  
    `ru#18541-18589`
  - The text states «Элен, дочь князя Василия».  
    `ru#30488-30532`
  - No parent, sibling, or spouse of «князь Василий» is stated by the text.  
    `kin-lexicon@693f2377:key:atoms/parent  kin-lexicon@693f2377:key:atoms/sibling  kin-lexicon@693f2377:key:atoms/spouse  ru#23456-23481  ru#0-74460`
  - Kin words in the text with an unbound end: 35.  
    `val:count(kin/unbound)  ru#0-74460`

## Q5 [T-ID] Who is Бонапарте in this text?
- **plain baseline:** Бонапарте: written as «Бонапарте», «Бонапарта», «Бонапарт»; written beside Энгиенский, Франции, Европа, Париж, Наполеон, Генуя in the quoted sentences
- **composer** (checker: all sentences pass):
  - «Бонапарте» is also written «Бонапарта» and «Бонапарт».  
    `ru#7379-7397  ru#32100-32118  ru#73696-73712`
  - The text states no parent, child, sibling, or spouse of «Бонапарте».  
    `kin-lexicon@693f2377:key:atoms/parent  kin-lexicon@693f2377:key:atoms/child  kin-lexicon@693f2377:key:atoms/sibling  kin-lexicon@693f2377:key:atoms/spouse  ru#7379-7397  ru#0-74460`
  - Kin words in the text with an unbound end: 35.  
    `val:count(kin/unbound)  ru#0-74460`

## Q6 [T-KIN] Which people in this text are князь Василий's kin, and how?
- **plain baseline:** князь Ипполит is the son of князь Василий (stated by the text); Элен is the daughter of князь Василий (stated by the text)
- **composer** (checker: all sentences pass):
  - «князь Ипполит» is the son of «князь Василий».  
    `ru#18530-18555  kin-lexicon@693f2377:key:atoms/son  ru#23456-23481`
  - «Элен» is the daughter of «князь Василий».  
    `ru#17908-17916  kin-lexicon@693f2377:key:atoms/daughter  ru#23456-23481`
  - The text states «Ипполит, сын князя Василия».  
    `ru#18541-18589`
  - The text states «Элен, дочь князя Василия».  
    `ru#30488-30532`
  - No parent, sibling, or spouse of «князь Василий» is stated by the text.  
    `kin-lexicon@693f2377:key:atoms/parent  kin-lexicon@693f2377:key:atoms/sibling  kin-lexicon@693f2377:key:atoms/spouse  ru#23456-23481  ru#0-74460`
  - Kin words in the text with an unbound end: 35.  
    `val:count(kin/unbound)  ru#0-74460`

## Q7 [T-SPEECH] Whom does Пьер speak to in this text?
- **plain baseline:** the window types no speech relation; written beside Пьер in its quoted sentences: Павловна, Анны, Андрей, Василий, Мортемара, России
- **composer:** not composed — no_record_for_question_kind (T-SPEECH)

## Q8 [C-UNCLE] Who is the uncle of князь Василий in this text?
- **plain baseline:** not in the context
- **composer** (checker: all sentences pass):
  - No uncle of «князь Василий» is derived.  
    `kin-lexicon@693f2377:key:composites/uncle  ru#23456-23481  ru#0-74460`
  - The text states no parent of «князь Василий».  
    `kin-lexicon@693f2377:key:atoms/parent  ru#23456-23481  ru#0-74460`

## Q9 [C-ABSENT] Who is Пётр Багратион in this text?
- **plain baseline:** not in the context
- **composer** (checker: all sentences pass):
  - The reading of the text has no being written «Пётр Багратион».  
    `q:Q9#7-21  ru#0-74460`

## Q10 [T-SPEECH] Whom does князь Василий speak to in this text?
- **plain baseline:** the window types no speech relation; written beside князь Василий in its quoted sentences: Павловна, Анна, Болконская, Элен, Пьеру, Шерер
- **composer:** not composed — no_record_for_question_kind (T-SPEECH)

## Q11 [C-UNCLE] Who is the uncle of Анна Павловна in this text?
- **plain baseline:** not in the context
- **composer** (checker: all sentences pass):
  - No uncle of «Анна Павловна» is derived.  
    `kin-lexicon@693f2377:key:composites/uncle  ru#693-718  ru#0-74460`
  - The text states no parent of «Анна Павловна».  
    `kin-lexicon@693f2377:key:atoms/parent  ru#693-718  ru#0-74460`

## Q12 [T-SPEECH] Whom does князь Андрей speak to in this text?
- **plain baseline:** the window types no speech relation; written beside князь Андрей in its quoted sentences: Пьера, Анна, Павловна, Бонапарте, Жорж, Василий
- **composer:** not composed — no_record_for_question_kind (T-SPEECH)

## Q13 [T-SPEECH] Whom does Элен speak to in this text?
- **plain baseline:** the window types no speech relation; written beside Элен in its quoted sentences: Василия, Анны, Павловны, Болконская, Петербурга, Мортемар
- **composer:** not composed — no_record_for_question_kind (T-SPEECH)

## Q14 [T-KIN] Which people in this text are Пьер's kin, and how?
- **plain baseline:** not in the context
- **composer** (checker: all sentences pass):
  - The text states no parent, child, sibling, or spouse of «Пьер».  
    `kin-lexicon@693f2377:key:atoms/parent  kin-lexicon@693f2377:key:atoms/child  kin-lexicon@693f2377:key:atoms/sibling  kin-lexicon@693f2377:key:atoms/spouse  ru#24928-24936  ru#0-74460`
  - Kin words in the text with an unbound end: 35.  
    `val:count(kin/unbound)  ru#0-74460`

## Q15 [T-SPEECH] Whom does Бонапарте speak to in this text?
- **plain baseline:** the window types no speech relation; written beside Бонапарте in its quoted sentences: Энгиенский, Франции, Европа, Париж, Наполеон, Генуя
- **composer:** not composed — no_record_for_question_kind (T-SPEECH)

## Q16 [T-SPEECH] Whom does Анна Павловна speak to in this text?
- **plain baseline:** the window types no speech relation; written beside Анна Павловна in its quoted sentences: Василия, Марии, Феодоровны, Анатоля, Австрию, Функе
- **composer:** not composed — no_record_for_question_kind (T-SPEECH)

## Q17 [C-UNCLE] Who is the uncle of Пьер in this text?
- **plain baseline:** not in the context
- **composer** (checker: all sentences pass):
  - No uncle of «Пьер» is derived.  
    `kin-lexicon@693f2377:key:composites/uncle  ru#24928-24936  ru#0-74460`
  - The text states no parent of «Пьер».  
    `kin-lexicon@693f2377:key:atoms/parent  ru#24928-24936  ru#0-74460`

## Q18 [C-ABSENT] Who is Наташа Ростова in this text?
- **plain baseline:** not in the context
- **composer** (checker: all sentences pass):
  - The reading of the text has no being written «Наташа Ростова».  
    `q:Q18#7-21  ru#0-74460`

## Q19 [T-KIN] Which people in this text are Бонапарте's kin, and how?
- **plain baseline:** not in the context
- **composer** (checker: all sentences pass):
  - The text states no parent, child, sibling, or spouse of «Бонапарте».  
    `kin-lexicon@693f2377:key:atoms/parent  kin-lexicon@693f2377:key:atoms/child  kin-lexicon@693f2377:key:atoms/sibling  kin-lexicon@693f2377:key:atoms/spouse  ru#7379-7397  ru#0-74460`
  - Kin words in the text with an unbound end: 35.  
    `val:count(kin/unbound)  ru#0-74460`

## Q20 [T-ID] Who is Элен in this text?
- **plain baseline:** Элен: written beside Василия, Анны, Павловны, Болконская, Петербурга, Мортемар in the quoted sentences; Элен is the daughter of князь Василий (stated by the text)
- **composer** (checker: all sentences pass):
  - «Элен» is Helene in the aligned edition (candidate).  
    `ru#17908-17916  parallel-names@ba95430b:val:rows/9/english  parallel-names@ba95430b:val:rows/9/standing`
  - «Элен» is female (text:ru, given).  
    `ru#17908-17916  kin-lexicon@693f2377:val:atoms/mother/sex  fold:kin/facts/3/giver  fold:kin/facts/3/standing`
  - «князь Василий» is the parent of «Элен».  
    `ru#23456-23481  kin-lexicon@693f2377:key:atoms/parent  ru#17908-17916`
  - The text states «Элен, дочь князя Василия».  
    `ru#30488-30532`
  - Neither male nor female is stated for «князь Василий» by the text.  
    `kin-lexicon@693f2377:val:atoms/father/sex  kin-lexicon@693f2377:val:atoms/mother/sex  ru#23456-23481  ru#0-74460`
  - The text states no child, sibling, or spouse of «Элен».  
    `kin-lexicon@693f2377:key:atoms/child  kin-lexicon@693f2377:key:atoms/sibling  kin-lexicon@693f2377:key:atoms/spouse  ru#17908-17916  ru#0-74460`
  - Kin words in the text with an unbound end: 35.  
    `val:count(kin/unbound)  ru#0-74460`

## Q21 [T-ID] Who is Анна Павловна in this text?
- **plain baseline:** Анна Павловна: written as «Анна Павловна», «Анне Павловне», «Анны Павловны», «Анна Павловна Шерер»; written beside Василия, Марии, Феодоровны, Анатоля, Австрию, Функе in the quoted sentences; female
- **composer** (checker: all sentences pass):
  - «Анна Павловна» is also written «Анне Павловне», «Анны Павловны», «Анна Павловна Шерер», «Анну Павловну», and «Шерер».  
    `ru#693-718  ru#2400-2425  ru#5013-5038  ru#693-729  ru#36188-36213  ru#719-729`
  - «Анна Павловна» is female (name-parts-ru, candidate).  
    `ru#693-718  kin-lexicon@693f2377:val:atoms/mother/sex  fold:kin/facts/4/giver  fold:kin/facts/4/standing`
  - The text states no parent, child, sibling, or spouse of «Анна Павловна».  
    `kin-lexicon@693f2377:key:atoms/parent  kin-lexicon@693f2377:key:atoms/child  kin-lexicon@693f2377:key:atoms/sibling  kin-lexicon@693f2377:key:atoms/spouse  ru#693-718  ru#0-74460`
  - Kin words in the text with an unbound end: 35.  
    `val:count(kin/unbound)  ru#0-74460`

## Q22 [T-KIN] Which people in this text are князь Андрей's kin, and how?
- **plain baseline:** not in the context
- **composer** (checker: all sentences pass):
  - The text states no parent, child, sibling, or spouse of «князь Андрей».  
    `kin-lexicon@693f2377:key:atoms/parent  kin-lexicon@693f2377:key:atoms/child  kin-lexicon@693f2377:key:atoms/sibling  kin-lexicon@693f2377:key:atoms/spouse  ru#43593-43616  ru#0-74460`
  - Kin words in the text with an unbound end: 35.  
    `val:count(kin/unbound)  ru#0-74460`

## Q23 [T-ID] Who is князь Андрей in this text?
- **plain baseline:** князь Андрей: written as «князь Андрей», «Болконский», «Князь Андрей», «князь Болконский»; written beside Пьера, Анна, Павловна, Бонапарте, Жорж, Василий in the quoted sentences
- **composer** (checker: all sentences pass):
  - «князь Андрей» is also written «Болконский», «Князь Андрей», «князь Болконский», «Князь Болконский», «Андрея», and «Андрей».  
    `ru#43593-43616  ru#15900-15920  ru#45586-45609  ru#15889-15920  ru#43681-43712  ru#45708-45720  ru#43604-43616`
  - The aligned edition gives Bolkonski for «князь Андрей» (candidate).  
    `parallel-names@ba95430b:val:rows/8/english  ru#43593-43616  parallel-names@ba95430b:val:rows/8/standing`
  - No parent, child, sibling, or spouse of «князь Андрей» is stated by the text.  
    `kin-lexicon@693f2377:key:atoms/parent  kin-lexicon@693f2377:key:atoms/child  kin-lexicon@693f2377:key:atoms/sibling  kin-lexicon@693f2377:key:atoms/spouse  ru#43593-43616  ru#0-74460`
  - Kin words in the text with an unbound end: 35.  
    `val:count(kin/unbound)  ru#0-74460`

## Q24 [T-ID] Who is Пьер in this text?
- **plain baseline:** Пьер: written as «Пьер», «Пьера», «Пьеру», «Пьером»; written beside Павловна, Анны, Андрей, Василий, Мортемара, России in the quoted sentences
- **composer** (checker: all sentences pass):
  - «Пьер» is also written «Пьера», «Пьеру», and «Пьером».  
    `ru#24928-24936  ru#24594-24604  ru#41419-41429  ru#48643-48655`
  - The aligned edition gives Pierre for «Пьер» (candidate).  
    `parallel-names@ba95430b:val:rows/12/english  ru#24928-24936  parallel-names@ba95430b:val:rows/12/standing`
  - No parent, child, sibling, or spouse of «Пьер» is stated by the text.  
    `kin-lexicon@693f2377:key:atoms/parent  kin-lexicon@693f2377:key:atoms/child  kin-lexicon@693f2377:key:atoms/sibling  kin-lexicon@693f2377:key:atoms/spouse  ru#24928-24936  ru#0-74460`
  - Kin words in the text with an unbound end: 35.  
    `val:count(kin/unbound)  ru#0-74460`

