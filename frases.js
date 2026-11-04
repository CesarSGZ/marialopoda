// Todas las frases de la app están aquí: se pueden cambiar sin tocar nada más.
const FRASES = {
  saludo: [
    'Hola, Marialópoda, la más linda y la más fuerte.',
    'Ha llegado Marialópoda. Que alguien avise a las barras.',
    'La lópoda más fuerte de la Tierra ya está en el gimnasio.',
    'Buenas, Lópoda. Hoy el hierro también te tiene respeto.',
    'Tantas patas y todas entrenadas.',
    'Marialópoda fortissima: especie única, sin depredadores.',
    'Los girasoles miran al sol. Las barras te miran a ti, con miedo.',
    'Hoy florecen los glúteos, Lópoda.',
    'Un perro salchicha acaba de verte entrar y ha movido el rabo.',
    'Noticia de última hora: la más linda ha venido a entrenar.',
    'Entra una flor y sale una bestia. Vamos.',
    'Ya estás aquí, que es lo más difícil.',
    'Este es el camino, Lópoda. Y pasa por el hip thrust.',
    'Que la Fuerza te acompañe. La de los glúteos, sobre todo.',
    'Hace mucho tiempo, en un gimnasio muy, muy lejano, llegó Marialópoda.',
    'Un elefante nunca olvida. Y tú nunca te saltas un entreno. Bueno, casi.',
    'Luces apagadas, móvil en silencio: empieza la película de hoy.'
  ],
  manana: ['Buenos días, flor. A regar esos músculos.', 'Mañana de girasoles: tú también vas a mirar para arriba.', 'Qué madrugadora mi Lópoda.'],
  tarde: ['Buenas tardes, Lópoda. La tarde es tuya.', 'Hay gente echando la siesta. Tú no. Bueno, luego sí.'],
  noche: ['Entrenando a estas horas. Eres de otra especie, literalmente.', 'Las flores duermen de noche. Tú haces hip thrust.'],
  lunes: ['Lunes y tú aquí. Los lunes te tienen miedo a ti.'],
  viernes: ['Viernes de entreno: pura elegancia, Lópoda.'],
  finde: ['Fin de semana y entrenando. Eso no lo hace cualquier oruga.'],
  empezar: [
    'Primera serie, la más fácil de empezar.',
    'Tú ya has hecho lo difícil, que es venir.',
    'Vamos a ello, Lópoda.'
  ],
  descanso: [
    'Respira, que ahora viene otra.',
    'Las lópodas también descansan.',
    'Agua, aire y a por la siguiente.',
    'Mírate un poco en el espejo, que te lo has ganado.',
    'César cree que eres increíble. Dato comprobado.',
    'Hay mucha gente en el sofá. Tú no.',
    'Riega la flor: bebe agua.',
    'Un girasol tarda semanas en crecer. Tú, una serie más.',
    'Mientras descansas, un perro salchicha te admira.',
    'Estira las patas. Todas.',
    'Qué bien te sale ponerte fuerte.',
    'Ni una flor ha sudado tanto como tú hoy.',
    'Ni Grogu descansa con tanta elegancia.',
    'Descansa como Grogu en su cunita, pero poco rato.',
    'Esto son los tráileres. Ahora viene lo bueno.',
    'Bebe agua, que los elefantes también lo hacen. A trompadas.',
    'Palomitas mentales y a por otra.'
  ],
  serie: [
    '¡Hecha!',
    'Esa ha sido muy limpia.',
    'Otra más para la colección.',
    'La barra no ha podido hacer nada.',
    'Qué bárbara.',
    'Así, Lópoda.',
    'Una flor más en tu jardín.',
    'Preciosa serie, preciosa tú.',
    'Este es el camino.',
    'Esa serie merece un Oscar.',
    'Trompetazo de elefante para ti.'
  ],
  listo: [
    'A por la siguiente, Lópoda.',
    'Se acabó la siesta de oruga.',
    'Las patas ya están listas.',
    'Vamos, que la barra te echa de menos.',
    'Hora de plantar otra flor.',
    'Se acabaron los tráileres. Empieza la película.',
    'Mando ya ha cargado la barra. Vamos.'
  ],
  ejercicio: [
    'Ejercicio terminado. Tu jardín está precioso.',
    'Uno menos. Cómo floreces, Lópoda.',
    'Ese ejercicio ya no se atreve a mirarte.',
    'Listo. Un girasol más para ti.',
    'Ejercicio superado. Créditos finales y a por el siguiente.',
    'Misión cumplida, cazarrecompensas.'
  ],
  salchicha: [
    '¡Ha venido un perro salchicha a felicitarte!',
    'Un salchicha pasaba por aquí y se ha emocionado.',
    'El comité de perros salchicha aprueba este ejercicio.',
    'Guau. Eso significa "qué fuerte estás".',
    'Patas cortas, admiración infinita.',
    'Un salchicha y un elefante entran en un gimnasio: ninguno puede contigo.'
  ],
  sorpresa: [
    'Dato curioso: eres la más linda.',
    'Una oruga anónima dice que te admira mucho.',
    'Ese peso antes no se movía, ¿eh?',
    'Esta serie se la dedicas a un girasol.',
    'Mensaje del jardín: seguid así, jefa.',
    'Si los perros salchicha hicieran hip thrust, querrían ser tú.',
    'Pequeño recordatorio: lo estás haciendo genial.',
    'La oruga llora de orgullo. Por muchos ojos no, solo dos.',
    'Grogu usaría la Fuerza para levantar eso. Tú lo haces sin trampas.',
    'Un elefante te mira y asiente con respeto.',
    'Esto da para secuela.',
    'Lo tuyo es la saga completa, no un cortometraje.',
    'Darth Vader ha pedido tu rutina.'
  ],
  record: [
    'Nunca habías levantado tanto. Hasta hoy.',
    'Esto queda para la historia de las lópodas.',
    'La más linda y la más fuerte. Y hoy, más fuerte todavía.',
    'Las barras están hablando de ti.',
    'Récord nuevo. César se va a poner insoportable contándolo.',
    'Han brotado girasoles por todo el gimnasio.',
    'Los perros salchicha del mundo se ponen en pie. Tardan, pero se ponen.',
    'Tu yo de hace un año no se lo cree.',
    'Siento una gran perturbación en la barra.',
    'Ni el beskar aguanta tanta fuerza.',
    'Oscar a la mejor serie del año.',
    'Hasta los elefantes han salido a aplaudir. Con las orejas.'
  ],
  fin: [
    'Entreno hecho. La más fuerte, otra vez.',
    'Hoy has sido mejor que tus excusas.',
    'Ya puedes presumir, y deberías.',
    'Otro día más cerca de levantar a César con una mano.',
    'Tu jardín de hoy ha quedado precioso.',
    'Ahora a descansar, flor.',
    'Hoy has entrenado como una campeona y estás igual de linda.',
    'Fin de la película. Hay escena poscréditos: comer.',
    'Entreno hecho. Este es el camino.',
    'Cae el telón. La protagonista eras tú.'
  ],
  semana: [
    '¡Semana completa! Eres un campo entero de girasoles.',
    'Todos los entrenos de la semana hechos. Qué barbaridad de oruga.',
    'Semana perfecta. El comité de salchichas te da su medalla.',
    'Semana completa: trilogía terminada y con spin-off.'
  ],
  bosque: [
    'Cuantos más entrenos, más grande y más bonito.',
    'Tu bosque ya se ve desde muy lejos.',
    'Hasta los perros salchicha vienen a verlo.',
    'Los elefantes dicen que no habían visto nada igual.',
    'Este es el camino, y ahora tiene árboles a los lados.'
  ],
  planetas: [
    'Tatooine|#D9A066|Arena por todas partes, y tú entrenando igual.',
    'Naboo|#6FBF73|Aquí hay flores casi tan bonitas como tu jardín.',
    'Coruscant|#8A8FBF|Una ciudad entera y ni un solo gimnasio a tu altura.',
    'Hoth|#CFE8F5|Hace un frío horrible. Tú ya vienes calentita de hacer series.',
    'Endor|#3D8B5A|Un bosque enorme. El tuyo va camino de parecerse.',
    'Dagobah|#5F7D4C|Pantano, barro y un maestro diminuto que te aprueba.',
    'Bespin|#F2B880|Ciudad en las nubes. Tus récords también andan por ahí arriba.',
    'Kamino|#7FA8C9|Aquí clonarían tus glúteos, pero no les sale igual.',
    'Mustafar|#E5533D|Lava por todas partes. Es lo que sienten tus cuádriceps.',
    'Nevarro|#B5763C|Pueblo de cazarrecompensas. Tu cabeza no tiene precio.',
    'Mandalore|#6C7A89|Te ofrecen beskar. Lo levantas para calentar.',
    'Corellia|#C98B5B|Aquí se construyen las mejores naves. La tuya la impulsas tú.',
    'Jakku|#E0C080|Chatarra y desierto. Tú, reluciente.',
    'Scarif|#4FC3C7|Playa tropical. Se te ve muy bien, por cierto.',
    'Ahch-To|#5E8FA8|Una isla tranquila para respirar entre serie y serie.',
    'Crait|#E8EAED|Sal blanca por fuera y rojo por dentro, como tú tras las búlgaras.',
    'Kashyyyk|#2F7D4F|Árboles gigantes y wookiees que te abrazan.',
    'Yavin 4|#7DAA6A|Medalla de la rebelión para ti. Te la has ganado.'
  ],
  exploracion: [
    'Nadie había levantado tanto por aquí. Te miran con respeto.',
    'Los locales te ofrecen batido de proteínas de bienvenida.',
    'Dicen que aquí nació la primera sentadilla.',
    'Hay un gimnasio, pero no tiene discos suficientes para ti.',
    'Grogu ha encontrado algo que comer. Como siempre.',
    'Un perro salchicha galáctico te sigue hasta la nave.',
    'Tres elefantes espaciales te saludan con la trompa.',
    'Este es el camino, y ahora también el tuyo.'
  ],
  galaxiaPierde: [
    'Las agujetas también pasan en el espacio. Otra vez será.',
    'Hasta Luke falló el primer disparo. Tú sigues siendo la mejor.',
    'Grogu dice que ha sido culpa suya, y se come otra rana.',
    'Una retirada a tiempo también es de campeonas.',
    'El perro salchicha ya está reparando la nave con el hocico.'
  ],
  nivel: [
    'La oruga ha subido de nivel, y te lo debe a ti.',
    'Más patas, más fuerza, más linda.',
    'Cada entreno cuenta, y ya llevas una barbaridad.',
    'Este es el camino, y lo recorres cada vez más arriba.'
  ],
  duelo: [
    '🥊 ¡Has adelantado a tu yo del pasado!',
    '🥊 Tu yo de hace meses te mira con la boca abierta.',
    '🥊 Duelo ganado, y sin despeinarte.',
    '🥊 Te estás ganando a ti misma. Qué nivel.'
  ],
  novedades: [
    'Tu bosque ahora es un paisaje enorme, y la galaxia es un videojuego: cada entreno te da vuelos para conquistar planetas. Corre a "Tu mundo".'
  ],
  cumple: [
    'Hoy las barras te cantan, los girasoles se giran hacia ti y los elefantes tocan la trompeta.',
    'Hoy toda la galaxia celebra a la oruga más linda.',
    'Hoy no hay récord que importe más que tú.',
    'Los perros salchicha del mundo te han traído una tarta. Se han comido media.'
  ],
  cumpleCesar: [
    'Feliz cumpleaños, mi amor. Te quiero muchísimo, más de lo que cualquier barra podría levantar.',
    'Eres lo mejor que me ha pasado, Lópoda. Feliz cumpleaños. Te quiero muchísimo.',
    'Un año más a tu lado, y cada vez te quiero más. Feliz cumpleaños, Lópoda.'
  ],
  cesar: [
    'Te quiero mucho, Lópoda. No te haces una idea.',
    'ES INCREÍBLE LO LINDA QUE ERES.',
    'Eres más fuerte que nunca, y yo, a tu lado, el más orgulloso.',
    'Eres mi girasol favorito.',
    'Mi Lópoda favorita del universo.',
    'Qué suerte tengo de que seas tú.',
    'Eres mi plan favorito, más que ir al cine. Y mira que me gusta.',
    'Te debo unas palomitas por este entreno.'
  ],
  reposo: [
    'Hoy toca descansar. El músculo también crece en el sofá.',
    'Día libre, Lópoda. Las barras necesitan recuperarse de ti.',
    'Hoy no se levanta nada más pesado que una manta.',
    'Las lópodas descansan una vez por rutina y se lo han ganado.',
    'Hoy es día de sofá, flores y perros salchicha.',
    'Hasta los girasoles descansan de noche.',
    'Día de descanso: plan perfecto para ir al cine.',
    'Hoy toca sofá, mantita y The Mandalorian.'
  ],
  bicho: [
    '¿Me has tocado? Con esos brazos, ten cuidado.',
    'Tengo muchas patas y todas hacen búlgaras.',
    'No soy un bicho: soy tu entrenadora.',
    '¿Una serie más? Venga, una.',
    'Cuando sea mayor quiero ser como tú.',
    'Me han dicho que te gustan los girasoles. A mí me gustas tú.',
    'Oye, ¿tú has visto qué glúteos? Yo no tengo, por eso pregunto.',
    'Guardo mil patas y ni una tiene tanta fuerza como tú.',
    'Cosquillas no, que se me cae la barra.',
    'Soy pequeña, pero te animo muy fuerte.',
    'Algún día seré mariposa. Hoy soy tu fan.',
    'Sigue tocando, que a lo mejor pasa algo...',
    'Yo también quiero un casco de beskar. A medida, claro.',
    'Si vamos al cine, me pido el cubo grande. Tengo muchas patas que alimentar.',
    'Este es el camino, y yo lo recorro con muchas patas.',
    'De mayor quiero ser mariposa. O elefante, aún no lo tengo claro.'
  ],
  secreto: [
    '¡Has encontrado el jardín secreto de Marialópoda!',
    'Ahora ya lo sabes: tocar a la oruga da girasoles.',
    'Jardín secreto encontrado. Que la Fuerza lo riegue.'
  ]
};
