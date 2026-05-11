/**
 * Seed: 10 movimientos base + 3 rutinas precargadas.
 *
 * Estrategia: upsert por slug. Es seguro re-ejecutar.
 * Se invoca con: pnpm db:seed (que setea DATABASE_URL al path de userData).
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const j = (arr: string[]) => JSON.stringify(arr)

// ---------- MOVIMIENTOS ----------

const movements = [
  {
    slug: 'landing-basic',
    name: 'Aterrizaje básico',
    category: 'landing',
    description:
      'Aterrizaje suave con flexión de tobillo, rodilla y cadera para absorber el impacto. Es el cimiento de todo lo demás.',
    difficulty: 1,
    requiredLevel: 'beginner',
    risks: j(['impacto en rodillas si caés rígido', 'tobillos vulnerables si no flexionás']),
    prerequisites: j([]),
    commonMistakes: j([
      'caer con las piernas rectas',
      'tobillos pegados al aterrizar',
      'mirar al piso al caer',
      'no usar los brazos para balance'
    ]),
    goodExecutionCues: j([
      'flexión simultánea de tobillo, rodilla y cadera',
      'rodillas alineadas con la punta de los pies',
      'antepié primero, nunca de talón',
      'brazos al frente para contrabalancear'
    ]),
    preparatoryDrills: j(['sentadillas', 'saltos en el lugar con caída controlada', 'step downs']),
    musclesInvolved: j(['cuádriceps', 'glúteos', 'gemelos', 'core']),
    tags: j(['fundamento', 'seguridad', 'impacto']),
    technicalGoal:
      'Disipar el impacto de la caída con flexión coordinada de tres articulaciones, protegiendo rodillas y columna.',
    safetyChecklist: j([
      'piso firme y seco',
      'altura inicial baja (caja, escalón, banco)',
      'calzado con buen agarre',
      'tobillos sin molestia previa'
    ])
  },
  {
    slug: 'roll',
    name: 'Roll de parkour',
    category: 'landing',
    description:
      'Rodada en diagonal hombro-cadera para disipar el impacto de caídas más altas. Protege la columna y las articulaciones.',
    difficulty: 3,
    requiredLevel: 'beginner',
    risks: j(['rodar sobre la columna', 'mal apoyo del cuello', 'caer sobre la clavícula']),
    prerequisites: j(['landing-basic']),
    commonMistakes: j([
      'rodar sobre la cabeza directo',
      'abrir el codo hacia afuera',
      'perder la diagonal hombro-cadera',
      'tensión excesiva al caer'
    ]),
    goodExecutionCues: j([
      'mentón al pecho durante la rotación',
      'diagonal del hombro a la cadera opuesta',
      'codo cerca del cuerpo',
      'primero suelo, después rotación'
    ]),
    preparatoryDrills: j(['roll desde rodillas', 'roll desde cuclillas', 'roll suave caminando']),
    musclesInvolved: j(['core', 'deltoides', 'oblicuos']),
    tags: j(['fundamento', 'seguridad', 'caídas']),
    technicalGoal:
      'Transformar el impacto vertical en rotación diagonal para repartir la carga y sobrevivir caídas más altas.',
    safetyChecklist: j([
      'pasaste por aterrizaje básico primero',
      'piso liso y sin objetos',
      'practicá desde rodillas antes que desde parado',
      'cuello sin contracturas'
    ])
  },
  {
    slug: 'precision-jump',
    name: 'Salto de precisión',
    category: 'precision',
    description:
      'Salto desde parado hacia un objetivo definido con aterrizaje estable de antepié. Construye control fino del impulso.',
    difficulty: 2,
    requiredLevel: 'beginner',
    risks: j(['resbalón en superficie estrecha', 'impacto si no llegás al objetivo']),
    prerequisites: j(['landing-basic']),
    commonMistakes: j([
      'saltar mirando al suelo',
      'usar talón al aterrizar',
      'no balancear los brazos',
      'no medir la distancia antes'
    ]),
    goodExecutionCues: j([
      'mirá fijo el objetivo, no el piso',
      'carga en talones, salto en antepié',
      'brazos atrás y luego al frente',
      'aterrizá lo más silencioso posible'
    ]),
    preparatoryDrills: j(['sentadillas con salto', 'saltos a cajón bajo', 'saltos a pies juntos en el lugar']),
    musclesInvolved: j(['cuádriceps', 'glúteos', 'gemelos', 'core']),
    tags: j(['control', 'técnica', 'fundamento']),
    technicalGoal:
      'Calibrar la potencia y el control del aterrizaje para llegar a un objetivo definido sin perder el balance.',
    safetyChecklist: j([
      'objetivo plano y antideslizante',
      'distancia corta para arrancar',
      'sin gente cerca del objetivo',
      'rodillas y tobillos sueltos previo al primer intento'
    ])
  },
  {
    slug: 'balance',
    name: 'Balance en barandas',
    category: 'balance',
    description:
      'Caminar y mantener equilibrio sobre superficies estrechas como barandas o rieles. Fundamental para precisión y confianza.',
    difficulty: 2,
    requiredLevel: 'beginner',
    risks: j(['caída lateral', 'torceduras de tobillo']),
    prerequisites: j([]),
    commonMistakes: j([
      'mirar los pies en lugar del frente',
      'tensar hombros y brazos',
      'caminar muy rápido al inicio',
      'brazos pegados al cuerpo'
    ]),
    goodExecutionCues: j([
      'mirada fija al frente',
      'brazos abiertos para contrapeso',
      'pasos lentos y firmes',
      'punta del pie alineada con la baranda'
    ]),
    preparatoryDrills: j(['caminar en línea pintada', 'balance estático en una pierna', 'caminar sobre cordón']),
    musclesInvolved: j(['core', 'tobillos', 'glúteo medio']),
    tags: j(['fundamento', 'control', 'concentración']),
    technicalGoal:
      'Construir control propioceptivo y confianza sobre superficies angostas, base para precisión y wallrun.',
    safetyChecklist: j([
      'baranda a altura baja al principio',
      'sin viento fuerte',
      'piso de caída blando o pasto',
      'tobillos sanos'
    ])
  },
  {
    slug: 'safety-vault',
    name: 'Safety vault',
    category: 'vault',
    description:
      'Pasaje sobre obstáculo apoyando una mano y pasando una pierna por encima entre el cuerpo y la mano. Vault más seguro para empezar.',
    difficulty: 2,
    requiredLevel: 'beginner',
    risks: j(['resbalón de la mano', 'patear el obstáculo con la pierna trasera']),
    prerequisites: j(['landing-basic']),
    commonMistakes: j([
      'apoyo de mano débil',
      'no pasar la pierna lo suficientemente alta',
      'salto sin extender el hombro',
      'aterrizar de talón'
    ]),
    goodExecutionCues: j([
      'mano firme primero, después salto',
      'pierna pasa entre cuerpo y mano',
      'mirada hacia el aterrizaje',
      'absorbé al caer con flexión completa'
    ]),
    preparatoryDrills: j(['apoyos en barandas bajas', 'swing de pierna lateral con apoyo', 'salto sobre cajón con una mano']),
    musclesInvolved: j(['pectorales', 'tríceps', 'core', 'abductores']),
    tags: j(['vault', 'técnica básica']),
    technicalGoal:
      'Atravesar un obstáculo con un apoyo simple controlado, manteniendo siempre dos puntos de contacto.',
    safetyChecklist: j([
      'obstáculo estable, sin moverse',
      'altura a la cintura como máximo al inicio',
      'mano hábil identificada',
      'muñeca y hombro calientes'
    ])
  },
  {
    slug: 'speed-vault',
    name: 'Speed vault',
    category: 'vault',
    description:
      'Salto lateral sobre obstáculo apoyando una mano, manteniendo la velocidad de carrera. Eficiencia sobre obstáculos en línea.',
    difficulty: 3,
    requiredLevel: 'base',
    risks: j(['pérdida de balance al aterrizar', 'falla del apoyo si vas muy rápido sin práctica']),
    prerequisites: j(['safety-vault', 'landing-basic']),
    commonMistakes: j([
      'frenar antes del apoyo',
      'girar el cuerpo demasiado',
      'apoyo de mano muy adelantado',
      'aterrizar de costado'
    ]),
    goodExecutionCues: j([
      'mantené velocidad antes del salto',
      'una mano apoya y empuja',
      'piernas extendidas paralelas al obstáculo',
      'aterrizá mirando al frente, no de costado'
    ]),
    preparatoryDrills: j(['safety vault con velocidad creciente', 'saltos laterales con apoyo de mano', 'apoyo + salto sobre cajón']),
    musclesInvolved: j(['hombros', 'tríceps', 'core', 'cuádriceps']),
    tags: j(['vault', 'velocidad']),
    technicalGoal:
      'Mantener velocidad de carrera atravesando un obstáculo lateral con un único apoyo de mano firme.',
    safetyChecklist: j([
      'safety vault dominado',
      'pista de aproximación libre',
      'obstáculo a la altura adecuada para tu mano',
      'tobillos y muñecas calientes'
    ])
  },
  {
    slug: 'lazy-vault',
    name: 'Lazy vault',
    category: 'vault',
    description:
      'Pasaje lateral sobre obstáculo apoyando dos manos en momentos separados. Fluido y elegante sobre barandas largas.',
    difficulty: 2,
    requiredLevel: 'beginner',
    risks: j(['agarre flojo en superficies húmedas', 'impacto en pierna trasera si pasa muy baja']),
    prerequisites: j(['landing-basic']),
    commonMistakes: j([
      'pasar las dos manos al mismo tiempo',
      'no extender la primera pierna',
      'girar el torso de más',
      'apoyo cerca del borde'
    ]),
    goodExecutionCues: j([
      'primera mano apoya, primera pierna pasa',
      'segunda mano controla, segunda pierna sigue',
      'fluidez sin saltos bruscos',
      'aterrizá en línea con el obstáculo'
    ]),
    preparatoryDrills: j(['caminar lateral apoyando manos en baranda', 'swing alternado de piernas', 'step over']),
    musclesInvolved: j(['hombros', 'core', 'abductores', 'isquios']),
    tags: j(['vault', 'fluidez', 'fundamento']),
    technicalGoal:
      'Pasar el obstáculo lateral sentándote sobre él con un apoyo, ganando fluidez antes que velocidad.',
    safetyChecklist: j([
      'obstáculo a la altura de cadera',
      'mano abierta y firme en el apoyo',
      'pierna externa pasa primero',
      'sin lesiones de muñeca'
    ])
  },
  {
    slug: 'kong-prep',
    name: 'Preparación de Kong vault',
    category: 'vault',
    description:
      'Drills preparatorios para el Kong: salto con dos manos al frente sobre obstáculos bajos. Construye coordinación brazos-piernas.',
    difficulty: 3,
    requiredLevel: 'base',
    risks: j(['caer de cara si las manos resbalan', 'impacto en muñecas']),
    prerequisites: j(['safety-vault', 'speed-vault']),
    commonMistakes: j([
      'abrir codos hacia afuera',
      'no extender los brazos antes del apoyo',
      'saltar sin agacharse primero',
      'manos muy juntas o muy separadas'
    ]),
    goodExecutionCues: j([
      'agachate antes de saltar',
      'manos al ancho de hombros',
      'empujá fuerte con los hombros',
      'pasá las piernas plegadas entre los brazos'
    ]),
    preparatoryDrills: j(['dive roll', 'salto rana sobre cajón', 'kong sobre obstáculo muy bajo']),
    musclesInvolved: j(['pectorales', 'deltoides anterior', 'tríceps', 'core', 'cuádriceps']),
    tags: j(['vault', 'preparación', 'intermedio']),
    technicalGoal:
      'Lanzar el cuerpo hacia adelante con empuje de hombros y plegado de piernas: paso previo al kong real.',
    safetyChecklist: j([
      'fuerza de empuje suficiente (test con plancha 30 s)',
      'obstáculo bajo y firme',
      'piso de aterrizaje libre',
      'sin dolor de hombros ni muñecas'
    ])
  },
  {
    slug: 'wall-run-basic',
    name: 'Wall run básico',
    category: 'wall',
    description:
      'Carrera corta hacia una pared para tomar altura con uno o dos pasos sobre la superficie vertical. Base para climb ups.',
    difficulty: 2,
    requiredLevel: 'beginner',
    risks: j(['resbalón con calzado inadecuado', 'caída hacia atrás si te paralizás']),
    prerequisites: j(['landing-basic']),
    commonMistakes: j([
      'pisar la pared sin compromiso',
      'frenar al pie de la pared',
      'saltar sin plan de qué agarrar arriba',
      'calzado plano o gastado'
    ]),
    goodExecutionCues: j([
      'un par de pasos firmes y empuje fuerte',
      'punta del pie pisa la pared, no el talón',
      'manos suben con el cuerpo',
      'mirada al borde superior'
    ]),
    preparatoryDrills: j(['correr y saltar sin pared', 'wall taps', 'step ups explosivos a cajón']),
    musclesInvolved: j(['cuádriceps', 'glúteos', 'gemelos', 'core']),
    tags: j(['wall', 'altura', 'fundamento']),
    technicalGoal:
      'Ganar altura con uno o dos apoyos del pie en la pared, llegando con las manos al borde sin agotarse.',
    safetyChecklist: j([
      'pared sin azulejos ni revoques flojos',
      'aterrizaje básico dominado',
      'altura objetivo a tu alcance probado',
      'sin lesiones de rodilla o tobillo'
    ])
  },
  {
    slug: 'climb-up-basic',
    name: 'Climb up básico',
    category: 'climb',
    description:
      'Subida desde colgado en muro: pasar de colgado a apoyado sentado en el borde. Combina fuerza y técnica.',
    difficulty: 2,
    requiredLevel: 'beginner',
    risks: j(['caída al intentar el muscle up', 'rasguños en antebrazos']),
    prerequisites: j(['wall-run-basic']),
    commonMistakes: j([
      'empujar sólo con brazos sin usar piernas',
      'no acercar las caderas a la pared',
      'intentarlo en muros muy altos sin práctica previa',
      'rendirse antes de pasar el codo'
    ]),
    goodExecutionCues: j([
      'caderas pegadas a la pared',
      'primero empujá con piernas, después con brazos',
      'pasá un codo arriba a la vez',
      'pecho sobre el borde antes de pasar las piernas'
    ]),
    preparatoryDrills: j(['dominadas', 'muscle up asistido', 'transiciones de codo en barra baja']),
    musclesInvolved: j(['dorsal', 'bíceps', 'tríceps', 'core', 'antebrazos']),
    tags: j(['climb', 'fuerza', 'altura']),
    technicalGoal:
      'Pasar del cuelgue a estar parado encima del borde usando empuje de piernas y transición de codos.',
    safetyChecklist: j([
      'borde firme y limpio',
      'al menos 5 dominadas seguidas',
      'piso de caída despejado',
      'sin dolor de hombros, codos o muñecas'
    ])
  }
] as const

// ---------- RUTINAS ----------

type ExerciseSeed = {
  movementSlug?: string
  name: string
  description?: string
  sets?: number
  reps?: number
  durationSec?: number
  restSec?: number
  notes?: string
}

type BlockSeed = {
  type: 'warmup' | 'technique' | 'strength' | 'mobility' | 'cooldown'
  exercises: ExerciseSeed[]
}

type RoutineSeed = {
  slug: string
  name: string
  description: string
  goal: 'technique' | 'mobility' | 'strength' | 'general'
  level: 'beginner' | 'base' | 'intermediate' | 'any'
  estimatedMin: number
  suitableForFatigue: 'low' | 'moderate' | 'any'
  avoidsInjuries: string[]
  blocks: BlockSeed[]
}

const routines: RoutineSeed[] = [
  {
    slug: 'primeros-pasos',
    name: 'Primeros pasos',
    description: 'Tu primera rutina. Aterrizajes seguros, balance básico y noción de roll.',
    goal: 'technique',
    level: 'beginner',
    estimatedMin: 40,
    suitableForFatigue: 'any',
    avoidsInjuries: [],
    blocks: [
      {
        type: 'warmup',
        exercises: [
          { name: 'Trote suave', durationSec: 300, notes: 'Ritmo cómodo, sin forzar' }
        ]
      },
      {
        type: 'technique',
        exercises: [
          { movementSlug: 'landing-basic', name: 'Aterrizaje básico', sets: 4, reps: 8, restSec: 30 },
          { movementSlug: 'balance', name: 'Balance en baranda baja', sets: 3, durationSec: 30, restSec: 30 }
        ]
      },
      {
        type: 'strength',
        exercises: [
          { name: 'Sentadillas', sets: 3, reps: 12, restSec: 60 },
          { name: 'Plancha', sets: 3, durationSec: 30, restSec: 45 }
        ]
      },
      {
        type: 'mobility',
        exercises: [{ name: 'Movilidad de tobillos', sets: 2, reps: 10, notes: 'Cada lado' }]
      },
      {
        type: 'cooldown',
        exercises: [{ name: 'Estiramientos generales', durationSec: 300 }]
      }
    ]
  },
  {
    slug: 'tecnica-base-segura',
    name: 'Técnica base segura',
    description: 'Vaults básicos con énfasis en aterrizar bien y rolar cuando hace falta.',
    goal: 'technique',
    level: 'base',
    estimatedMin: 50,
    suitableForFatigue: 'moderate',
    avoidsInjuries: [],
    blocks: [
      {
        type: 'warmup',
        exercises: [{ name: 'Trote + movilidad articular', durationSec: 480 }]
      },
      {
        type: 'technique',
        exercises: [
          { movementSlug: 'landing-basic', name: 'Aterrizaje básico', sets: 3, reps: 6 },
          { movementSlug: 'safety-vault', name: 'Safety vault', sets: 4, reps: 5, restSec: 60 },
          { movementSlug: 'lazy-vault', name: 'Lazy vault', sets: 4, reps: 5, restSec: 60 },
          { movementSlug: 'roll', name: 'Roll', sets: 3, reps: 5, restSec: 60 }
        ]
      },
      {
        type: 'strength',
        exercises: [
          { name: 'Sentadillas con salto', sets: 3, reps: 10 },
          { name: 'Flexiones', sets: 3, reps: 8 }
        ]
      },
      {
        type: 'mobility',
        exercises: [{ name: 'Movilidad de cadera y muñecas', durationSec: 420 }]
      },
      {
        type: 'cooldown',
        exercises: [{ name: 'Estiramientos suaves', durationSec: 180 }]
      }
    ]
  },
  {
    slug: 'movilidad-control',
    name: 'Movilidad y control',
    description: 'Sesión liviana para días de fatiga o recuperación. Control y movilidad, sin impacto fuerte.',
    goal: 'mobility',
    level: 'any',
    estimatedMin: 35,
    suitableForFatigue: 'any',
    avoidsInjuries: [],
    blocks: [
      {
        type: 'warmup',
        exercises: [{ name: 'Movilidad articular general', durationSec: 300 }]
      },
      {
        type: 'technique',
        exercises: [
          { movementSlug: 'balance', name: 'Balance en baranda', sets: 4, durationSec: 45 },
          { movementSlug: 'precision-jump', name: 'Saltos de precisión cortos', sets: 3, reps: 6, restSec: 45 }
        ]
      },
      {
        type: 'mobility',
        exercises: [
          { name: 'Movilidad de tobillos', sets: 3, reps: 10, notes: 'Cada lado' },
          { name: 'Movilidad de cadera', sets: 3, reps: 10, notes: 'Cada lado' },
          { name: 'Movilidad de muñecas', sets: 2, reps: 15 }
        ]
      },
      {
        type: 'cooldown',
        exercises: [{ name: 'Respiración y estiramiento ligero', durationSec: 180 }]
      }
    ]
  }
]

// ---------- EJECUCIÓN ----------

async function main() {
  console.log(`[seed] DATABASE_URL=${process.env['DATABASE_URL']}`)

  // Movimientos: upsert por slug.
  for (const m of movements) {
    await prisma.movement.upsert({
      where: { slug: m.slug },
      create: m,
      update: m
    })
  }
  console.log(`[seed] movimientos: ${movements.length} upsertados`)

  // Rutinas: upsert por slug, con borrado y recreación de bloques (más simple que diff).
  for (const r of routines) {
    const existing = await prisma.routine.findUnique({ where: { slug: r.slug } })
    if (existing) {
      await prisma.routineBlock.deleteMany({ where: { routineId: existing.id } })
    }

    const routine = await prisma.routine.upsert({
      where: { slug: r.slug },
      create: {
        slug: r.slug,
        name: r.name,
        description: r.description,
        goal: r.goal,
        level: r.level,
        estimatedMin: r.estimatedMin,
        suitableForFatigue: r.suitableForFatigue,
        avoidsInjuries: JSON.stringify(r.avoidsInjuries),
        isBuiltIn: true
      },
      update: {
        name: r.name,
        description: r.description,
        goal: r.goal,
        level: r.level,
        estimatedMin: r.estimatedMin,
        suitableForFatigue: r.suitableForFatigue,
        avoidsInjuries: JSON.stringify(r.avoidsInjuries)
      }
    })

    for (let bi = 0; bi < r.blocks.length; bi++) {
      const b = r.blocks[bi]!
      const block = await prisma.routineBlock.create({
        data: {
          routineId: routine.id,
          type: b.type,
          order: bi
        }
      })

      for (let ei = 0; ei < b.exercises.length; ei++) {
        const e = b.exercises[ei]!
        let movementId: string | null = null
        if (e.movementSlug) {
          const mv = await prisma.movement.findUnique({ where: { slug: e.movementSlug } })
          movementId = mv?.id ?? null
        }
        await prisma.routineExercise.create({
          data: {
            blockId: block.id,
            movementId,
            name: e.name,
            description: e.description ?? null,
            sets: e.sets ?? null,
            reps: e.reps ?? null,
            durationSec: e.durationSec ?? null,
            restSec: e.restSec ?? null,
            notes: e.notes ?? null,
            order: ei
          }
        })
      }
    }
  }
  console.log(`[seed] rutinas: ${routines.length} upsertadas`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
    console.log('[seed] OK')
  })
  .catch(async (e) => {
    console.error('[seed] ERROR', e)
    await prisma.$disconnect()
    process.exit(1)
  })
