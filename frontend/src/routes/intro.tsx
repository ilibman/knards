import './intro.scss';

export default function Intro() {
  return (
    <>
      {/* MOBILE VERSION */}
      <div className="intro-section mobile-version">
      </div>

      {/* DESKTOP VERSION */}
      <div className="intro-section desktop-version">
        {/* FIRST ROW */}
        <div className="col1 box music">
          <div>
            <h3 className="font-bold">2003 - 2018</h3>
            <p>Andrijko si po střední vykňourá od rodičů kytaru a, po nějakém čase, bez toho aby Andrijko měl sebemenší hudební ambice, se z bezcílného vybrnkavání stane jeho oblíbený způsob prokrastinace v jakýchkoli aktivitách jakkoli spojených se sebemíň serióznímí snahami najít své místo ve světě.</p>
            <p className="brnk">brnk<br/>brnk</p>
          </div>
          <div className="arrow-down">
          </div>
          <div className="to-dole-arr">
            <div className="cover-arr"></div>
          </div>
          <div>
            <h3 className="font-bold">2018+</h3>
            <p>Andrijko hraje v 350 kapelách.</p>
          </div>
        </div>
        <div className="col2">
          <div className="arrow from-2008-to-cz">
            <div className="mid-to-right-stem"></div>
            <div className="mid-stem"></div>
          </div>
        </div>
        <div className="col3 box">
          <div>
            <h3 className="font-bold">2003 - 2008</h3>
            <p>Andrijko absolventem úplně obyčejné střední školy nastoupí do Vysoké školy technické ve své (skoro) rodné Poltavě, úspěšně ju absolvuje a získá diplom Specialisty z aplikované informatiky.</p>
          </div>
          <div className="arrow-down">
          </div>
          <div className="to-dole-arr">
            <div className="cover-arr"></div>
          </div>
        </div>

        {/* SECOND ROW */}
        <div className="col2">
          <div className="arrow on-the-way-from-2008-to-cz">
            <div className="mid-stem"></div>
          </div>
        </div>
        <div className="col3 box emigrace">
          <div>
            <h3 className="font-bold">2008 - 2010</h3>
            <p>Andrijko pracuje v oboru, dumá o tom, kdo to takhle vymyslel, že v noci v nebi svítí všechny hvězdy a přes den jen jedna, nakonec se rozhodne emigrovat do Česka a taky že emigruje!</p>
          </div>
          <div className="arrow-down1">
          </div>
          <div className="to-dole-arr1">
            <div className="cover-arr"></div>
          </div>
          <div className="arrow-down2">
          </div>
          <div className="to-dole-arr2">
            <div className="cover-arr"></div>
          </div>
          <div className="arrow-down3">
          </div>
          <div className="to-dole-arr3">
            <div className="cover-arr"></div>
          </div>
        </div>

        {/* THIRD ROW */}
        <div className="col2">
          <div className="arrow on-the-way-from-2008-to-cz-dole">
            <div className="mid-stem"></div>
            <div className="mid-to-right-stem"></div>
            <div className="to-right-arr">
              <div className="cover-arr"></div>
            </div>
          </div>
        </div>
        <div className="col3 box rocni-kurz">
          <div className="full-height-box">
            <h3 className="font-bold">2010 - 2015</h3>
            <p>Andrijko absolvuje roční kurz z češtiny (neuvěřitelný přínos!), nastoupí na vejšku, neuspěje a pak zas a pak zas, nakonec, i přes veškeré ambice se stát člověkem učeným a váženým, selže, hlavně kvůli snaze žít život nejen studentský, ale taky pracovní a i takovej ten mladej.</p>
            <p>Nadále mu přece jen pomůže řádně a včasně nostrifikovaný diplom po VŠ v Ukrajině.</p>
          </div>
          <div className="arrow-down"></div>
          <div className="arrow-right"></div>
        </div>
        <div className="col5 box">
          <div>
            <h3 className="font-bold">2010 - 2015</h3>
            <p>Andrijko dělá v gastru: roznos jídel, plac, kuchyň, zkusil jsem všechno a všechno mě bavilo, dokonce jsem snil o kariéře kucháře, jenže brzo rok 2016 ukáže, že najít práci programátorem bude o dost jednodušší, než kuchářem ach jo...</p>
            <p>Btw koležstvo, s nímž jsem po těch restauracích dělal, bylo vesměs uprchlictvo z Balkánu, tudíž dá se říct, že jsem měl takový pětiletý kurz srbochorvatštiny také plus nezměřitelnou dávku interkulturních zkušeností ;)</p>
          </div>
        </div>
        <div className="col6">
          <div className="arrow from-gastro-to-opu">
            <div className="mid-to-right-stem"></div>
            <div className="mid-stem"></div>
          </div>
        </div>

        {/* FOURTH ROW */}
        <div className="col4 arr-to-2016">
          <div className="arrow on-the-way-from-studium-to-it">
            <div className="mid-stem"></div>
            <div className="to-right-arr">
              <div className="cover-arr"></div>
            </div>
          </div>
        </div>
        <div className="col5 box it">
          <div className="full-height-box">
            <h3 className="font-bold">2016 - 2026</h3>
            <p>Andrijko pracuje v IT</p>
            <p>Emm... jako bylo to fajn asi... Je to taková bažina většinou, ale já jsem byl mnohem větší vodník v těch dobách.</p>
            <p>Ted́ umím naprogramovat něco jako tohleto...</p>
            <p className="vyhorel1">Hrozně jsem v tom vyhořel...</p>
            <p className="vyhorel2">Myslím v komerčním IT, něco smysluplnějšího bych holt programoval.</p>
          </div>
          <div className="arrow-down">
          </div>
          <div className="to-dole-arr">
            <div className="cover-arr"></div>
          </div>
        </div>
        <div className="col6 on-the-way-from-gastro-to-opu">
          <div className="arrow-down">
          </div>
        </div>
        <div className="col7 box opu-dobro">
          <div>
            <h3 className="font-bold">2022 - 2026</h3>
            <p>Začne se válka. Andrij si uvědomí, že někomu něco přece jen dluží, už jen proto, že je. Uvědomí si, že pro tu nejsprávnější věc mu nestačí odvaha, tak si rozhodne o tu druhou nejsprávnější věc: jít dobrovolničit, pomáhat uprchlictvu, pomáhat těm, kdo zůstal a těm, kdo bojuje.</p>
            <p>V rámcích OPU nejdřív chodí na uprchlický hotel na I.P.Pavlova, kde většinu času straví aktivitami s dětmi. Po uzavření hotelu zůstane jako dobrovolník v OPU, pořád chodí za dětmi do jiných ubytoven, dělá doprovody.</p>

            <div className="subbox">
              <h3 className="font-bold">2023+</h3>
              <p>Andrijko namáčí nohy do aktivismu. Kamarádí s kolektivem Jezevky, chodí na schůzky, ATD.! Dlouhodobě se snaží, spolu s dalším entuziaststvem, oživit, občas úspěšně, občas not so much, pražský Rhythms of Resistance.</p>
            </div>
          </div>
        </div>

        {/* FIFTH ROW */}
        <div className="col3 box opu-prace">
          <div>
            <h3 className="font-bold">2026</h3>
            <p>Andrijko interkulturním pracovníkem v OPU!</p>
          </div>
          <div className="arrow-down1">
          </div>
          <div className="stem-up1"></div>
          <div className="to-dole-arr1">
            <div className="cover-arr"></div>
          </div>
          <div className="arrow-down2">
          </div>
          <div className="stem-up2"></div>
          <div className="to-dole-arr2">
            <div className="cover-arr"></div>
          </div>
          <div className="stem-into-music"></div>
          <div className="stem-right"></div>
          <div className="stem-down"></div>
          <div className="to-empty-arr">
            <div className="cover-arr"></div>
          </div>
        </div>
      </div>
    </>
  );
}
