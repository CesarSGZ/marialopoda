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
    'Ya estás aquí, que es lo más difícil.'
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
    'Ni una flor ha sudado tanto como tú hoy.'
  ],
  serie: [
    '¡Hecha!',
    'Esa ha sido muy limpia.',
    'Otra más para la colección.',
    'La barra no ha podido hacer nada.',
    'Qué bárbara.',
    'Así, Lópoda.',
    'Una flor más en tu jardín.',
    'Preciosa serie, preciosa tú.'
  ],
  listo: [
    'A por la siguiente, Lópoda.',
    'Se acabó la siesta de oruga.',
    'Las patas ya están listas.',
    'Vamos, que la barra te echa de menos.',
    'Hora de plantar otra flor.'
  ],
  ejercicio: [
    'Ejercicio terminado. Tu jardín está precioso.',
    'Uno menos. Cómo floreces, Lópoda.',
    'Ese ejercicio ya no se atreve a mirarte.',
    'Listo. Un girasol más para ti.'
  ],
  salchicha: [
    '¡Ha venido un perro salchicha a felicitarte!',
    'Un salchicha pasaba por aquí y se ha emocionado.',
    'El comité de perros salchicha aprueba este ejercicio.',
    'Guau. Eso significa "qué fuerte estás".',
    'Patas cortas, admiración infinita.'
  ],
  sorpresa: [
    'Dato curioso: eres la más linda.',
    'Una oruga anónima dice que te admira mucho.',
    'Ese peso antes no se movía, ¿eh?',
    'Esta serie se la dedicas a un girasol.',
    'Mensaje del jardín: seguid así, jefa.',
    'Si los perros salchicha hicieran hip thrust, querrían ser tú.',
    'Pequeño recordatorio: lo estás haciendo genial.',
    'La oruga llora de orgullo. Por muchos ojos no, solo dos.'
  ],
  record: [
    'Nunca habías levantado tanto. Hasta hoy.',
    'Esto queda para la historia de las lópodas.',
    'La más linda y la más fuerte. Y hoy, más fuerte todavía.',
    'Las barras están hablando de ti.',
    'Récord nuevo. César se va a poner insoportable contándolo.',
    'Han brotado girasoles por todo el gimnasio.',
    'Los perros salchicha del mundo se ponen en pie. Tardan, pero se ponen.',
    'Tu yo de hace un año no se lo cree.'
  ],
  fin: [
    'Entreno hecho. La más fuerte, otra vez.',
    'Hoy has sido mejor que tus excusas.',
    'Ya puedes presumir, y deberías.',
    'Otro día más cerca de levantar a César con una mano.',
    'Tu jardín de hoy ha quedado precioso.',
    'Ahora a descansar, flor.',
    'Hoy has entrenado como una campeona y estás igual de linda.'
  ],
  semana: [
    '¡Semana completa! Eres un campo entero de girasoles.',
    'Todos los entrenos de la semana hechos. Qué barbaridad de oruga.',
    'Semana perfecta. El comité de salchichas te da su medalla.'
  ],
  cesar: [
    'Te quiero mucho, Lópoda. No te haces una idea.',
    'ES INCREÍBLE LO LINDA QUE ERES.',
    'Eres más fuerte que nunca, y yo, a tu lado, el más orgulloso.',
    'Eres mi girasol favorito.',
    'Mi Lópoda favorita del universo.',
    'Qué suerte tengo de que seas tú.'
  ],
  reposo: [
    'Hoy toca descansar. El músculo también crece en el sofá.',
    'Día libre, Lópoda. Las barras necesitan recuperarse de ti.',
    'Hoy no se levanta nada más pesado que una manta.',
    'Las lópodas descansan una vez por rutina y se lo han ganado.',
    'Hoy es día de sofá, flores y perros salchicha.',
    'Hasta los girasoles descansan de noche.'
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
    'Sigue tocando, que a lo mejor pasa algo...'
  ],
  secreto: [
    '¡Has encontrado el jardín secreto de Marialópoda!',
    'Ahora ya lo sabes: tocar a la oruga da girasoles.'
  ]
};
