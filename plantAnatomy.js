/* =========================================================
   GREEN LIVING — PLANT-SPECIFIC BOTANICAL ANATOMY EXPLORER
   Garden Studio only. Plant-specific data, leader-line
   hotspots and plant-specific anatomy explanations.
   ========================================================= */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  // Resolve bundled assets relative to this script, not the browser's current route.
  // This keeps local assets working when the site is served from a nested folder or route.
  const SCRIPT_BASE_URL = (() => {
    const script = document.currentScript;
    try { return new URL('.', script && script.src ? script.src : window.location.href); }
    catch (_) { return new URL('.', window.location.href); }
  })();
  const assetUrl = (path) => {
    if (!path || /^(?:https?:|data:|blob:|\/\/)/i.test(String(path))) return path;
    try { return new URL(String(path).replace(/^\.\//, ''), SCRIPT_BASE_URL).href; }
    catch (_) { return path; }
  };
  const library=$('anatomyLibrary'), plantInfo=$('anatomyPlantInfo'), stage=$('anatomyCanvasWrap');
  const partList=$('anatomyPartList'), modes=$('anatomyModes');
  const timeline=$('botanicalTimeline'), processInfo=$('botanicalProcessInfo');
  const imageLayer=$('botanicalImageLayer'), mainImage=$('anatomyMainImage');
  const labels=$('anatomyLabels'), imageCaption=$('anatomyImageCaption');
  if(!library||!plantInfo||!stage||!partList||!mainImage||!imageLayer||!labels)return;

  const photo=(id)=>`https://images.unsplash.com/${id}?auto=format&fit=crop&w=1500&q=90`;
  const plants={
    tulip:{name:'Tulip',latin:'Tulipa gesneriana',category:'Flowering bulb plant',image:photo('photo-1683014752469-cbcbc1cb8a80'),description:'A spring-flowering bulb plant with a cup-shaped flower, upright stem and smooth foliage.',light:'Full sun',water:'Moderate during growth',humidity:'Outdoor conditions',care:'Seasonal',parts:['flower','petals','stamen','pistil','leaf','stem','bulb','roots'],hotspots:[['flower',52,24],['petals',58,29],['stamen',51,35],['pistil',63,37],['leaf',34,68],['stem',52,59],['bulb',49,88],['roots',39,93]]},
    monstera:{name:'Monstera',latin:'Monstera deliciosa',category:'Indoor climbing aroid',image:photo('photo-1750341005643-e79d6ec30979'),description:'A tropical climbing aroid recognised by mature split leaves, strong petioles and aerial roots.',light:'Bright, indirect',water:'When top soil dries',humidity:'Medium–high',care:'Moderate',parts:['leaf','fenestrations','veins','petiole','stem','node','aerial','roots'],hotspots:[['leaf',68,27],['fenestrations',72,37],['veins',62,42],['petiole',58,53],['stem',48,66],['node',50,73],['aerial',41,78],['roots',47,91]]},
    peace:{name:'Peace Lily',latin:'Spathiphyllum wallisii',category:'Flowering tropical aroid',image:photo('photo-1714916837044-e72448b8c005'),description:'A tropical evergreen with glossy lance-shaped leaves and a white spathe surrounding a flower-bearing spadix.',light:'Medium, indirect',water:'Keep lightly moist',humidity:'Medium–high',care:'Moderate',parts:['spathe','spadix','leaf','veins','petiole','roots','rootHair','stomata'],hotspots:[['spathe',52,25],['spadix',57,34],['leaf',30,57],['veins',34,62],['petiole',47,73],['roots',49,91],['rootHair',43,94],['stomata',24,50]]},
    snake:{name:'Snake Plant',latin:'Dracaena trifasciata',category:'Succulent-like foliage plant',image:photo('photo-1696508902086-2a82cdef9f48'),description:'An architectural plant with upright, sword-shaped leaves adapted to conserve water.',light:'Low to bright indirect',water:'Allow soil to dry fully',humidity:'Low–medium',care:'Easy',parts:['leaf','epidermis','waterTissue','rhizome','roots','stomata'],hotspots:[['leaf',53,27],['epidermis',59,37],['waterTissue',48,46],['rhizome',51,83],['roots',44,92],['stomata',64,42]]},
    money:{name:'Money Plant',latin:'Epipremnum aureum',category:'Trailing tropical vine',image:photo('photo-1534726955665-2cb2d145f2ad'),description:'A climbing or trailing vine with heart-shaped leaves, flexible stems and aerial roots at nodes.',light:'Bright, indirect',water:'When top soil dries',humidity:'Medium',care:'Easy',parts:['leaf','veins','petiole','stem','node','aerial','roots','stomata'],hotspots:[['leaf',59,31],['veins',63,38],['petiole',50,48],['stem',42,66],['node',48,61],['aerial',40,76],['roots',49,91],['stomata',69,35]]},
    orchid:{name:'Orchid',latin:'Phalaenopsis spp.',category:'Flowering epiphyte',image:photo('photo-1748800553157-93ce20aa6068'),description:'A flowering epiphyte with specialised blooms, fleshy leaves and aerial roots covered by velamen.',light:'Bright, indirect',water:'When medium nearly dries',humidity:'Medium–high',care:'Moderate',parts:['petals','labellum','column','pollinia','flowerStalk','leaf','velamen','roots'],hotspots:[['petals',54,24],['labellum',54,35],['column',60,31],['pollinia',64,30],['flowerStalk',51,57],['leaf',49,77],['velamen',39,87],['roots',52,93]]},
    fiddle:{name:'Fiddle-leaf Fig',latin:'Ficus lyrata',category:'Indoor tree',image:photo('photo-1763616310356-883d6931321a'),description:'A woody indoor tree with broad violin-shaped leaves and prominent pale lateral veins.',light:'Bright, indirect',water:'When top soil dries',humidity:'Medium',care:'Moderate',parts:['leaf','veins','petiole','stem','node','roots','stomata'],hotspots:[['leaf',61,25],['veins',62,33],['petiole',54,46],['stem',48,66],['node',48,55],['roots',50,91],['stomata',70,40]]}
  };

  // Every plant/part pair has its own botanical explanation and focus point.
  const details={
    tulip:{
      flower:['Flower','Flos','A single terminal bloom with six petal-like tepals arranged in two whorls.','The bloom presents the reproductive organs and attracts pollinators during the short flowering period.',['The tepals open as the flower matures.','Anthers release pollen around the central pistil.','Pollination can lead to fertilisation and seed development.'],'The flower enables sexual reproduction before the plant returns to bulb-based dormancy.','Tulips typically have six tepals, six stamens and a three-parted ovary.',['Tepals','Anther','Pistil']],
      petals:['Tepals','Tepala','Tulip floral segments are technically tepals because the outer and inner whorls look similar.','Their colour and shape provide a visual display for insect visitors.',['The tepals expand as the bud opens.','Pigments create colour signals.','The segments protect reproductive organs while the flower is closed.'],'The tepals protect the flower and contribute to pollinator attraction.','Tulip tepals are not clearly divided into separate sepals and petals.',['Outer tepal','Inner tepal','Floral base']],
      stamen:['Stamen and anther','Androecium','Six stamens surround the pistil; each has a filament and a pollen-bearing anther.','Anthers produce pollen grains that carry the male gametophyte.',['Pollen develops inside anther sacs.','The anther matures and opens.','Pollen is transferred by a visiting pollinator or other contact.'],'Pollen production is essential for fertilisation and seed formation.','A typical tulip flower has six stamens.',['Anther','Filament','Pollen']],
      pistil:['Pistil','Gynoecium','The central female structure includes a stigma, short style and a superior ovary with ovules.','It receives pollen and houses ovules where fertilisation takes place.',['Pollen reaches the stigma.','A pollen tube grows toward an ovules inside the ovary.','After fertilisation, ovules can develop into seeds.'],'The pistil enables the formation of the next generation by seed.','The tulip ovary is typically three-lobed.',['Stigma','Style','Ovary','Ovule']],
      leaf:['Leaf blade','Lamina','Tulip leaves are smooth, elongated and often slightly glaucous, with parallel-running veins.','The blade captures light and exchanges carbon dioxide, oxygen and water vapour.',['Chlorophyll absorbs light in leaf cells.','Carbon dioxide enters through stomata.','Chloroplasts use light energy to make sugars.'],'Sugars support flowering and replenish the bulb for the next growth cycle.','Tulip leaves commonly show parallel venation, typical of monocots.',['Cuticle','Epidermis','Mesophyll','Vein']],
      stem:['Flowering stem','Scapus','The upright, usually unbranched flowering shoot supports the bloom and contains vascular bundles.','It positions the flower and conducts water, minerals and sugars.',['Xylem carries water upward from the bulb and roots.','The stem supports the flower head.','Phloem moves sugars between leaves and storage organs.'],'The stem raises the flower for pollinator access and links shoot to bulb.','The flowering stem is a herbaceous scape.',['Epidermis','Ground tissue','Xylem','Phloem']],
      bulb:['Bulb','Bulbus','The bulb is a compact underground storage organ formed from a short stem and fleshy storage leaf bases.','It stores carbohydrates and protects the dormant growing point.',['Leaves photosynthesise during active growth.','Sugars move into bulb scales.','Stored reserves fuel the next season’s shoot and flower.'],'The bulb allows tulips to survive an unfavourable season and regrow.','A tulip bulb is a tunicate bulb with a dry protective outer layer.',['Protective tunic','Fleshy scale','Basal plate','Bud']],
      roots:['Fibrous root system','Radix','Roots emerge from the bulb basal plate as a cluster of slender adventitious roots.','They anchor the plant and absorb water and mineral ions.',['Root surfaces contact moist soil.','Water enters root cells by osmosis.','Mineral ions move into vascular tissue and then toward the shoot.'],'Roots supply the water needed for leaf growth and flowering.','Tulips generally form a fibrous adventitious root system.',['Root cap','Root hairs','Cortex','Xylem']]
    },
    monstera:{
      leaf:['Monstera leaf blade','Lamina','A large, leathery blade with a heart-shaped base, deep splits and mature fenestrations.','The blade captures light while its openings help reduce wind resistance and distribute light through the canopy.',['Light reaches chloroplast-rich mesophyll.','Stomata admit carbon dioxide.','Photosynthesis produces sugars for climbing growth and new leaves.'],'The large blade supplies energy to support the plant’s vigorous vine and aerial roots.','Fenestrations usually become more pronounced as Monstera leaves mature.',['Cuticle','Palisade tissue','Spongy tissue','Vein']],
      fenestrations:['Leaf fenestrations','Fenestrationes','Natural holes and edge splits form in mature Monstera deliciosa leaves.','They alter the leaf’s shape and can allow wind and light to pass through the canopy.',['The leaf develops from a rolled young structure.','As it expands, species-specific openings form.','The mature blade maintains a large photosynthetic surface.'],'Fenestrations are a distinctive mature-leaf feature used in identification.','Fenestration development varies with species, leaf age and growing conditions.',['Leaf opening','Lateral vein','Leaf margin']],
      veins:['Monstera leaf veins','Nervi folii','A strong midrib branches into lateral veins that form a visible network across the blade.','Xylem supplies water; phloem exports sugars; the veins also reinforce the broad leaf.',['Water travels into the blade through xylem.','Mesophyll cells make sugars.','Phloem transports sugars to stems, roots and growing leaves.'],'Veins support the broad blade and connect photosynthesis with the rest of the vine.','The prominent midrib is continuous with the petiole vascular system.',['Midrib','Lateral vein','Xylem','Phloem']],
      petiole:['Monstera petiole','Petiolus','A long, sturdy leaf stalk joins the blade to a stem node.','It positions the blade toward light and carries vascular tissue between stem and leaf.',['The petiole attaches at a node.','Xylem supplies water to the leaf.','Phloem carries sugars away from the blade.'],'Its length and flexibility help position the large blade.','The petiole is distinct from the stem and from the leaf blade.',['Leaf blade','Vascular bundle','Petiole base']],
      stem:['Climbing stem','Caulis scandens','The thick vine has nodes, internodes and attachment points from which leaves and aerial roots emerge.','It supports the plant as it climbs and transports water and assimilates.',['New growth extends from the shoot tip.','Xylem moves water upward.','Phloem distributes sugars to growing tips and roots.'],'The climbing stem lets Monstera reach brighter canopy conditions.','Monstera is a hemiepiphytic climbing aroid in its natural habitat.',['Node','Internode','Vascular bundle']],
      node:['Stem node','Nodus','A node is the stem point where a leaf, axillary bud and often an aerial root originate.','It is an important growth and propagation point.',['A leaf attaches at the node.','An axillary bud may remain dormant or grow.','An adventitious aerial root can emerge from the same region.'],'Nodes allow the vine to branch, climb and root along its length.','The stem segment between nodes is called an internode.',['Leaf scar','Axillary bud','Aerial root']],
      aerial:['Aerial roots','Radices aerei','Thick adventitious roots grow from stem nodes above the soil.','They help the vine attach to supports and can take up moisture; roots reaching soil can absorb water and minerals.',['A root primordium forms at a node.','The root grows toward a support or humid surface.','It anchors the vine or reaches substrate.'],'Aerial roots are important for climbing and support in the forest understory.','Aerial roots are not stems; they are true roots arising above ground.',['Root tip','Adhesive region','Root cap']],
      roots:['Soil roots','Radix','Branching roots grow into the potting medium and contain absorptive zones and vascular tissues.','They anchor the vine and absorb water and dissolved mineral nutrients.',['Root hairs contact moisture around substrate particles.','Water enters root cells by osmosis.','Water and minerals reach the xylem for transport to leaves.'],'Healthy roots maintain hydration for the large, transpiring leaves.','Root tips contain a protective cap and actively dividing meristem.',['Root cap','Root hairs','Cortex','Xylem']]
    },
    peace:{
      spathe:['Peace Lily spathe','Spatha','The white, leaf-like bract surrounds and displays the upright flower-bearing spadix.','It protects the developing inflorescence and helps make the tiny flowers conspicuous to pollinators.',['The spathe begins wrapped around the young spadix.','It unfurls as the inflorescence matures.','Its pale surface frames the spadix during flowering.'],'The spathe is the conspicuous display structure, not an individual petal.','Peace lilies are aroids; their inflorescence is a spadix enclosed by a spathe.',['Spathe blade','Spathe margin','Spadix']],
      spadix:['Peace Lily spadix','Spadix','A fleshy spike carries many tiny, tightly arranged flowers along its surface.','It bears the actual reproductive flowers of the inflorescence.',['Individual flowers mature along the spadix.','Pollen is presented during the male phase.','Receptive female structures can receive pollen during the female phase.'],'The spadix contains the reproductive organs that can produce seeds after successful pollination.','Aroids often show protogyny, with female and male flower phases separated in time.',['Female zone','Male zone','Individual flower']],
      leaf:['Peace Lily leaf blade','Lamina','The glossy, lance-shaped blade tapers to a point and has a prominent midrib with curved lateral veins.','It captures light for photosynthesis and regulates gas exchange and water loss.',['Light is absorbed by chloroplasts in mesophyll cells.','Carbon dioxide enters through stomata.','Sugars are produced and exported through phloem.'],'Leaf sugars support new leaves, roots and inflorescence development.','The leaf is a simple, entire blade with pinnate-reticulate venation.',['Cuticle','Epidermis','Palisade mesophyll','Vein']],
      veins:['Peace Lily leaf veins','Nervi folii','A strong central midrib gives rise to curved lateral veins across the glossy blade.','Xylem supplies water while phloem distributes sugars from photosynthesis.',['Water enters the midrib through the petiole.','Lateral veins distribute water through the blade.','Phloem carries sugars toward growing tissues.'],'The vein network supports the leaf and maintains its water supply.','The lateral veins curve toward the leaf margin.',['Midrib','Lateral vein','Xylem','Phloem']],
      petiole:['Peace Lily petiole','Petiolus','A long leaf stalk rises from the basal crown and connects the blade to the rhizomatous base.','It holds the blade above surrounding foliage and conducts vascular flow.',['The petiole emerges from the crown.','Xylem moves water into the blade.','Phloem returns sugars to the plant base and growing organs.'],'The petiole helps arrange leaves to intercept light.','Peace Lily leaves arise from a basal clump rather than a woody trunk.',['Petiole surface','Vascular bundle','Leaf sheath']],
      roots:['Peace Lily roots','Radix','A dense cluster of pale, branching roots emerges from the plant’s short rhizomatous base.','Roots anchor the clump and absorb water and mineral ions from the growing medium.',['Root surfaces contact moist medium.','Water enters root cells by osmosis.','The root vascular cylinder conducts water toward the leaves.'],'Roots sustain the evergreen leaves and support repeated flowering.','Peace Lily is a monocot with adventitious roots.',['Root cap','Cortex','Endodermis','Xylem']],
      rootHair:['Root hairs','Pili radicales','Microscopic extensions of young root epidermal cells increase the surface area in contact with moist medium.','They improve uptake of water and mineral ions.',['A root-hair cell extends between substrate particles.','Water enters down a water-potential gradient.','Mineral ions cross membranes through transport proteins.'],'Root hairs make the absorptive surface more effective.','Root hairs are delicate and are replaced as root tips grow.',['Root hair','Epidermis','Cortex']],
      stomata:['Peace Lily stomata','Stomata','Tiny pores in the leaf epidermis are bordered by paired guard cells.','They regulate carbon dioxide entry and water-vapour loss.',['Guard cells change turgor.','The stomatal pore opens or closes.','Gas exchange and transpiration respond to light and water status.'],'Stomatal control balances photosynthesis with water conservation.','Stomata are microscopic and are not visible as individual pores in the whole-plant photograph.',['Guard cell','Pore','Epidermal cell']]
    },
    snake:{
      leaf:['Snake Plant leaf','Lamina','The thick, upright, sword-shaped leaf has a waxy surface and water-storing inner tissue.','It performs photosynthesis while limiting water loss in dry indoor conditions.',['The leaf stores water in succulent tissues.','Carbon dioxide is taken up mainly at night through open stomata.','Stored carbon is used in daytime photosynthesis.'],'The thick leaf stores water and supports drought tolerance.','Snake Plant uses crassulacean acid metabolism (CAM) photosynthesis.',['Cuticle','Epidermis','Water-storage tissue','Vascular bundle']],
      epidermis:['Waxy leaf epidermis','Epidermis','A protective outer cell layer is covered by a relatively thick cuticle.','It reduces uncontrolled water loss and protects inner tissues.',['The cuticle forms a water-resistant surface.','Stomata provide regulated gas exchange.','The epidermis protects internal photosynthetic tissue.'],'The protective surface is central to the plant’s ability to tolerate dry periods.','The cuticle is a wax-rich extracellular layer, not a living cell layer.',['Cuticle','Epidermal cell','Stoma']],
      waterTissue:['Water-storage tissue','Hydrenchyma','Large, thin-walled cells in the thick leaf store water within succulent tissue.','Stored water helps maintain cell turgor during dry conditions.',['Water enters the leaf through roots.','Water is retained in succulent cells.','Stored water supports metabolism between watering events.'],'Water storage reduces the risk of rapid wilting.','The thick leaf is an adaptation for water conservation.',['Storage cell','Chlorenchyma','Vascular bundle']],
      rhizome:['Underground rhizome','Rhizoma','A horizontal, fleshy stem at or just below the soil surface produces leaf fans and roots.','It stores reserves and allows vegetative spread.',['The rhizome grows laterally.','New shoots arise from buds.','Adventitious roots extend into the growing medium.'],'The rhizome is the plant’s main vegetative renewal structure.','The upright leaves arise from rhizome buds, not from a woody trunk.',['Bud','Rhizome tissue','Root origin']],
      roots:['Snake Plant roots','Radix','Fibrous roots emerge from the rhizome and spread through the potting medium.','They anchor the plant and take up water and dissolved minerals.',['Root hairs contact water films.','Water enters root cells by osmosis.','Xylem conducts water into the leaves.'],'Roots replenish water stored in the thick leaves.','Roots are adventitious and arise from the rhizome.',['Root cap','Root hairs','Cortex','Xylem']],
      stomata:['Snake Plant stomata','Stomata','Microscopic pores are controlled by guard cells in the leaf epidermis.','They regulate gas exchange with a timing pattern adapted to CAM photosynthesis.',['Stomata tend to open at night.','Carbon dioxide is fixed into organic acids.','During daylight, stored carbon is used while stomata are more closed.'],'Night-time gas uptake helps conserve water in dry environments.','CAM separates initial carbon dioxide uptake from much of the daytime carbon fixation.',['Guard cells','Stomatal pore','Epidermis']]
    },
    money:{
      leaf:['Money Plant heart-shaped leaf','Lamina','The glossy, heart-shaped blade has a pointed tip and a visible midrib with branching lateral veins.','It captures light and makes carbohydrates for vine and root growth.',['Chlorophyll absorbs light.','Stomata admit carbon dioxide.','Photosynthesis forms sugars that phloem distributes through the vine.'],'Healthy leaves provide energy for new climbing shoots.','Juvenile leaves are usually smaller and less divided than mature leaves grown while climbing.',['Cuticle','Midrib','Lateral vein','Mesophyll']],
      veins:['Money Plant leaf veins','Nervi folii','A central midrib branches into curved veins that spread through the heart-shaped blade.','The veins transport water and sugars and help support the leaf.',['Xylem supplies water from the petiole.','Mesophyll cells photosynthesise.','Phloem transports sugars to growing vine tips and roots.'],'Veins connect each leaf’s photosynthesis to the whole plant.','The visible venation is a useful guide to the blade’s structure.',['Midrib','Lateral vein','Xylem','Phloem']],
      petiole:['Money Plant petiole','Petiolus','A slender stalk attaches the leaf blade to the climbing stem at a node.','It positions the blade and links its vascular tissues to the vine.',['The petiole joins the stem at a node.','Xylem moves water into the leaf.','Phloem exports sugars from the blade.'],'A flexible petiole helps the leaf orient toward available light.','The petiole is separate from the internode of the vine.',['Leaf blade','Petiole','Vascular strand']],
      stem:['Climbing vine stem','Caulis','A flexible stem extends between nodes and can climb when supported.','It carries water, minerals and sugars while supporting leaves and new shoots.',['The growing tip extends the vine.','Xylem transports water from roots.','Phloem distributes sugars to growing and storage tissues.'],'The stem allows the plant to spread and climb toward light.','The stem is a true shoot axis with nodes and internodes.',['Epidermis','Cortex','Xylem','Phloem']],
      node:['Vine node','Nodus','A node is the joint where a leaf petiole, axillary bud and aerial root may arise.','It enables branching, climbing and vegetative propagation.',['The leaf attaches at the node.','A dormant bud can produce a new shoot.','An aerial root can emerge and attach to a support.'],'Nodes are the key locations for taking viable stem cuttings.','A cutting generally needs at least one viable node to produce a new shoot or roots.',['Leaf attachment','Axillary bud','Root primordium']],
      aerial:['Aerial roots','Radices adventiciae','Short adventitious roots emerge from nodes along the vine above the potting medium.','They attach the vine to supports and can absorb moisture; soil-reaching roots absorb water and minerals.',['Root primordia develop at nodes.','Roots extend toward a support.','They anchor the climbing stem or reach the substrate.'],'Aerial roots help pothos climb naturally and establish new contact points.','Aerial roots are true roots, not tendrils.',['Root tip','Adhesive zone','Root cap']],
      roots:['Money Plant soil roots','Radix','A branching root system grows from stem nodes or the plant base into the potting mix.','It anchors the vine and absorbs water and mineral nutrients.',['Root hairs contact moist particles.','Water enters root cells by osmosis.','Xylem transports water into the shoot.'],'The root system supplies the water needed by actively growing leaves.','Pothos can form roots at stem nodes, which is why stem cuttings propagate readily.',['Root hairs','Cortex','Endodermis','Xylem']],
      stomata:['Money Plant stomata','Stomata','Microscopic pores bordered by guard cells occur in the leaf epidermis.','They regulate carbon dioxide uptake, oxygen release and transpiration.',['Guard cells respond to light and water status.','Pores open to admit carbon dioxide.','Water vapour diffuses outward during transpiration.'],'Stomatal regulation helps balance sugar production with water conservation.','Stomata are microscopic and require magnification to observe.',['Guard cells','Pore','Epidermis']]
    },
    orchid:{
      petals:['Orchid petals and sepals','Perianth','The flower has three sepals and three petals; one petal is modified into a distinctive labellum.','The perianth protects the flower bud and provides visual signals to pollinators.',['The bud opens to expose the perianth.','Colour and shape guide pollinator approach.','The labellum provides a landing or positioning surface.'],'The specialised floral display helps direct pollinators toward the column.','Orchid flowers are typically bilaterally symmetrical.',['Dorsal sepal','Petal','Lateral sepal']],
      labellum:['Orchid labellum','Labellum','One petal is modified into a lip with a distinctive shape, often marked with ridges or colour patterns.','It acts as a landing platform and helps position a pollinator near the reproductive column.',['A visitor approaches the flower.','The labellum guides its landing position.','Contact with the column can remove or deposit pollinia.'],'The labellum is a key adaptation for specialised pollination.','The labellum is a modified petal, not a separate reproductive organ.',['Labellum','Callus','Column']],
      column:['Orchid column','Gynostemium','The column is a fused reproductive structure combining parts of the stamens and pistil.','It positions pollen masses and the receptive stigma in a compact structure.',['A pollinator contacts the column.','Pollinia may attach to the visitor.','Pollinia are placed on a receptive stigma of another flower.'],'The column makes orchid pollination precise and highly specialised.','Fusion of male and female floral structures is characteristic of orchids.',['Anther cap','Stigma','Rostellum']],
      pollinia:['Pollinia','Pollinia','Pollen grains are packaged into cohesive masses rather than released as loose powder.','Pollinia transfer pollen efficiently between flowers, often by animal pollinators.',['Pollinia mature beneath the anther cap.','A pollinator contacts and removes the pollen mass.','The mass is deposited onto a receptive stigma.'],'This pollen packaging supports precise pollination.','Many orchids have pollinia attached to a small viscidium or adhesive structure.',['Pollinium','Anther cap','Viscidium']],
      flowerStalk:['Orchid flower stalk','Pedunculus','The upright inflorescence stalk carries one or more flowers above the leaf rosette.','It supports flowers and connects them to the plant’s vascular system.',['The stalk elongates from the plant base or leaf axil.','Vascular tissue supplies developing buds.','Flowers open along the inflorescence.'],'The stalk elevates blooms for pollinator access.','Phalaenopsis flower spikes can branch at nodes after flowering.',['Spike node','Bract','Vascular bundle']],
      leaf:['Orchid leaf','Lamina','Phalaenopsis leaves are thick, strap-shaped and arranged in a basal rosette.','They photosynthesise and store water and carbohydrates.',['The leaf receives filtered light.','Chloroplasts produce sugars.','Stored reserves support new leaves, roots and flower spikes.'],'Fleshy leaves help the epiphyte tolerate intervals between water availability.','Many Phalaenopsis leaves have a thick cuticle and substantial water-storage tissue.',['Cuticle','Storage tissue','Midrib']],
      velamen:['Velamen root covering','Velamen radicum','A spongy multilayered outer covering surrounds the aerial roots of many epiphytic orchids.','It rapidly absorbs water and helps protect the root beneath.',['The dry velamen appears silvery.','When wet, it fills with water and becomes greener as the inner root shows through.','The living cortex and stele use absorbed water.'],'Velamen helps orchids capture brief pulses of rain and humidity.','Velamen cells are usually dead at maturity and form a porous outer layer.',['Velamen','Exodermis','Cortex','Stele']],
      roots:['Orchid aerial roots','Radices aerei','Thick aerial roots extend from the stem base and are often green at their tips.','They anchor the epiphyte and absorb water and nutrients from rain, air and debris.',['Root tips grow toward humid surfaces.','Velamen absorbs water rapidly.','The living root tissues transport water into the plant.'],'Aerial roots are essential for anchorage and resource capture without soil.','Epiphytic Phalaenopsis roots commonly have a velamen covering.',['Root tip','Velamen','Cortex','Stele']]
    },
    fiddle:{
      leaf:['Fiddle-leaf Fig blade','Lamina','A broad, leathery, violin-shaped leaf has a rounded upper blade and prominent pale lateral veins.','It captures light and carries out photosynthesis and regulated gas exchange.',['Light reaches palisade cells.','Stomata admit carbon dioxide.','Sugars are produced and transported to the woody stem and roots.'],'The large leaf surface supports the tree’s energy requirements.','The characteristic lyre-like blade shape gives Ficus lyrata its common name.',['Cuticle','Palisade tissue','Spongy tissue','Vein']],
      veins:['Fiddle-leaf Fig venation','Nervi folii','A strong midrib and conspicuous lateral veins radiate through the broad leaf blade.','They transport water and sugars and reinforce the leaf.',['Xylem brings water through the petiole.','Veins distribute water across the blade.','Phloem exports sugars to stems and roots.'],'The prominent veins help support the heavy leaf blade.','The leaf shows pinnate venation with strong lateral veins.',['Midrib','Lateral vein','Xylem','Phloem']],
      petiole:['Fiddle-leaf Fig petiole','Petiolus','A stout leaf stalk joins the blade to the woody branch at a node.','It supports the broad leaf and provides a vascular connection.',['The petiole attaches to the branch.','Xylem supplies the blade.','Phloem moves photosynthates toward the trunk and roots.'],'A strong petiole supports the relatively large, heavy leaf.','Leaf scars remain on the woody stem after leaves are shed.',['Leaf blade','Petiole','Vascular bundle']],
      stem:['Woody stem','Caulis lignosus','The upright woody axis supports branches and leaves and contains secondary vascular tissues.','It provides structural strength and long-distance transport.',['Cambium produces secondary xylem and phloem.','Xylem conducts water upward.','Phloem distributes sugars to growing and storage organs.'],'Woody growth allows the plant to develop a tree-like framework.','Ficus species produce latex in specialised laticifer tissues.',['Bark','Cambium','Secondary xylem','Phloem']],
      node:['Branch node','Nodus','A node marks the attachment of a leaf and an axillary bud on the woody shoot.','It is a potential site for new branch growth.',['A leaf attaches at the node.','An axillary bud sits above the leaf scar.','Bud growth can extend the branch.'],'Nodes help determine branch architecture and pruning response.','The internode is the stem length between successive nodes.',['Leaf scar','Axillary bud','Internode']],
      roots:['Fiddle-leaf Fig roots','Radix','A woody, branching root system spreads through the potting medium and develops finer absorptive roots.','It anchors the tree and absorbs water and mineral nutrients.',['Fine roots explore the substrate.','Water enters root hairs and cortex.','Xylem transports water into the trunk and leaves.'],'A balanced root system supports the canopy and maintains water supply.','As a woody dicot, Ficus develops secondary growth in older roots.',['Root hair','Cortex','Cambium','Xylem']],
      stomata:['Fiddle-leaf Fig stomata','Stomata','Guard-cell pairs surround microscopic pores in the leaf epidermis.','They regulate carbon dioxide entry and transpiration.',['Guard cells respond to light and plant water status.','The pore opens for carbon dioxide uptake.','Water vapour diffuses out and contributes to transpiration pull.'],'Stomata help regulate leaf temperature and water balance.','Stomatal density and distribution can vary between leaf surfaces.',['Guard cells','Pore','Epidermis']]
    }
  };


  // Expanded library: additional species use their own profile, photograph query,
  // organ set and species-specific anatomical notes. Existing seven profiles remain intact.
  const extraPlantSpecs = [{"id":"rose","name":"Rose","latin":"Rosa × hybrida","category":"Flowering shrub","query":"rose flower plant red pink","description":"A woody flowering shrub with compound leaves, prickles and layered blooms.","light":"Full sun","water":"Deep water at soil level","humidity":"Outdoor average","care":"Moderate","parts":["flower","petals","stamen","pistil","leaf","stem","prickles","roots"],"hotspots":[["flower",38,27],["petals",39,29],["stamen",42,31],["pistil",40,33],["leaf",75,57],["stem",50,73],["prickles",62,78],["roots",50,94]],"notes":{"leaf":"Compound leaves usually have serrated leaflets with a netted vein pattern.","stem":"Woody canes bear leaves, buds and sharp prickles that help deter browsing.","roots":"A branching root system anchors the shrub and supplies water to new shoots.","flower":"The flower has petals surrounding numerous stamens and a central group of carpels."}},{"id":"sunflower","name":"Sunflower","latin":"Helianthus annuus","category":"Flowering annual","query":"sunflower bloom plant","description":"A tall annual with a large composite flower head and broad rough leaves.","light":"Full sun","water":"Regular deep watering","humidity":"Outdoor average","care":"Easy","parts":["flowerHead","rayFlorets","discFlorets","seeds","leaf","stem","roots"],"hotspots":[["flowerHead",48,48],["rayFlorets",48,31],["discFlorets",50,49],["seeds",50,55],["leaf",80,70],["stem",62,84],["roots",50,94]],"notes":{"leaf":"Broad rough leaves attach alternately and have prominent netted veins.","stem":"A sturdy herbaceous stem supports the heavy flower head and transports water.","roots":"A strong taproot with lateral roots anchors the tall annual.","flower":"The apparent flower is a head of many tiny disc florets surrounded by ray florets."}},{"id":"jasmine","name":"Jasmine","latin":"Jasminum sambac","category":"Flowering shrub","query":"jasmine white flowers plant","description":"A fragrant evergreen shrub or climber with glossy leaves and white star-like flowers.","light":"Bright light","water":"Keep lightly moist","humidity":"Medium–high","care":"Moderate","parts":["flower","petals","stamen","pistil","leaf","stem","roots"],"hotspots":[["flower",34,39],["petals",36,42],["stamen",34,38],["pistil",38,41],["leaf",68,25],["stem",25,73],["roots",50,94]],"notes":{"leaf":"Simple opposite leaves are glossy and have a clear midrib with branching veins.","stem":"Flexible green stems may climb or sprawl and become woody with age.","roots":"A branching root system anchors the shrub and takes up water and minerals.","flower":"White tubular flowers open into fragrant lobes, often in small clusters."}}];
  const selectedExtraPlantIds = new Set(['rose','sunflower','jasmine']);
  // Verified, direct image files for the three added flowering plants.
  // Each has a second source so the UI can recover if a host is temporarily unavailable.
  const plantImages = {
    rose: {
      image: 'https://images.pexels.com/photos/17291046/pexels-photo-17291046.png?cs=srgb&dl=pexels-lauripoldre-17291046.jpg&fm=jpg',
      fallbackImage: 'https://www.homefortheharvest.com/wp-content/uploads/2023/11/rose-bush.jpg'
    },
    sunflower: {
      image: 'https://images.pexels.com/photos/597039/nature-sunflower-plants-summer-597039.jpeg?cs=srgb&dl=pexels-free-nature-stock-597039.jpg&fm=jpg',
      fallbackImage: 'https://images.pexels.com/photos/17926196/pexels-photo-17926196.jpeg?cs=srgb&dl=pexels-chalta-phirta-307182428-17926196.jpg&fm=jpg'
    },
    jasmine: {
      image: 'https://images.pexels.com/photos/287697/pexels-photo-287697.jpeg?cs=srgb&dl=pexels-digitalbuggu-287697.jpg&fm=jpg',
      fallbackImage: 'https://images.pexels.com/photos/36744915/pexels-photo-36744915.jpeg?cs=srgb&dl=pexels-jahratreza-36744915.jpg&fm=jpg'
    }
  };
  const organLabels = {
    leaf:'Leaf blade',veins:'Leaf veins',petiole:'Petiole',stem:'Stem',node:'Stem node',roots:'Root system',
    aerial:'Aerial roots',flower:'Flower',petals:'Petals / tepals',stamen:'Stamen and anther',pistil:'Pistil',
    spathe:'Spathe',spadix:'Spadix',rhizome:'Rhizome',tuber:'Tuber',bulb:'Bulb',stomata:'Stomata',
    flowerHead:'Flower head',rayFlorets:'Ray florets',discFlorets:'Disc florets',seeds:'Seeds',seedPod:'Seed receptacle',
    flowerSpike:'Flower spike',florets:'Individual florets',scape:'Flower stalk (scape)',bracts:'Floral bracts',bract:'Bract',
    corona:'Corona',tepals:'Tepals',sepals:'Sepals',labellum:'Labellum',column:'Flower column',pollinia:'Pollinia',
    flowerStalk:'Flower stalk',velamen:'Velamen',frond:'Frond',pinnae:'Pinnae',rachis:'Rachis',sori:'Sori',
    runner:'Runner / stolon',plantlet:'Plantlet',prickles:'Prickles',corm:'Corm',caudex:'Caudex',
    leaflets:'Leaflets',leafEpidermis:'Leaf epidermis',gel:'Water-storage gel',latex:'Latex canals',
    crown:'Crown',rosette:'Leaf rosette',waterTissue:'Water-storage tissue',epidermis:'Epidermis'
  };
  const organGroup = (key) => {
    if(/root|velamen|rhizome|tuber|bulb|corm|caudex/i.test(key)) return 'root';
    if(/flower|petal|stamen|pistil|spathe|spadix|floret|bract|corona|tepal|sepal|labellum|column|pollinia|sori/i.test(key)) return 'flower';
    if(/stem|node|petiole|runner|rachis|scape/i.test(key)) return 'stem';
    return 'leaf';
  };
  function makeExtraDetail(spec, key) {
    const label = organLabels[key] || key.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase());
    const group = organGroup(key);
    const partStructures = {
      leaf:`The ${spec.name} leaf has ${spec.notes.leaf || 'a species-specific blade adapted to its growing conditions'} Its visible shape, surface and venation are characteristic of ${spec.latin}.`,
      veins:`The leaf veins of ${spec.name} form a branching vascular network; xylem supplies water while phloem carries sugars away from photosynthetic tissue.`,
      petiole:`The ${spec.name} petiole joins the leaf blade to its supporting shoot and contains vascular strands that connect the blade with the stem.`,
      stem:`The ${spec.name} stem has ${spec.notes.stem || 'a growth-form-specific supporting axis'} and contains vascular tissues linking roots, leaves and reproductive structures.`,
      node:`A node on ${spec.name} is the point where leaves, buds or roots can arise; the stem segment between nodes is an internode.`,
      roots:`The root system of ${spec.name} has ${spec.notes.roots || 'branching absorptive roots'} that anchor the plant and take up water and mineral ions.`,
      aerial:`The aerial roots of ${spec.name} emerge above the growing medium; depending on the species they attach to supports or absorb moisture from humid air.`,
      flower:`The ${spec.name} flower has ${spec.notes.flower || 'species-specific floral organs'} that support pollination and sexual reproduction.`,
      petals:`The petals or petal-like floral segments of ${spec.name} form the visible floral display and help protect or present its reproductive organs.`,
      stamen:`The stamens of ${spec.name} are the pollen-producing male floral organs; each typical stamen includes a filament and anther.`,
      pistil:`The pistil of ${spec.name} is the female reproductive structure; its stigma receives pollen and its ovary contains ovules.`,
      spathe:`The spathe of ${spec.name} is a modified bract that surrounds or displays the spadix inflorescence.`,
      spadix:`The ${spec.name} spadix is a fleshy floral axis bearing many small flowers, often protected by a spathe.`,
      rhizome:`The ${spec.name} rhizome is a horizontal or compact underground stem that stores reserves and can produce new shoots and roots.`,
      tuber:`The storage tuber of ${spec.name} stores carbohydrates and water that can support regrowth during a later growing period.`,
      bulb:`The ${spec.name} bulb is a compact underground storage organ with a short basal stem and fleshy leaf bases surrounding a growing point.`,
      stomata:`Stomata on ${spec.name} are microscopic pores bordered by guard cells; they regulate carbon dioxide uptake and water-vapour loss.`,
      flowerHead:`The flower head of ${spec.name} is a composite inflorescence made up of many small florets arranged on a shared receptacle.`,
      rayFlorets:`The ray florets of ${spec.name} form the outer showy part of its composite flower head and contribute to pollinator display.`,
      discFlorets:`The disc florets of ${spec.name} occupy the central region of the flower head and commonly contain functional reproductive organs.`,
      seeds:`Seeds of ${spec.name} contain an embryo and stored reserves enclosed by a protective seed coat.`,
      seedPod:`The seed-bearing structure of ${spec.name} develops after fertilisation and protects the developing seeds until maturity.`,
      flowerSpike:`The flower spike of ${spec.name} is an upright inflorescence axis carrying multiple small flowers or florets.`,
      florets:`The individual florets of ${spec.name} are small flowers grouped together into a larger visual inflorescence.`,
      scape:`The scape of ${spec.name} is a specialised flower stalk that rises from the basal crown and supports the inflorescence.`,
      sepals:`The sepals of ${spec.name} form the outer floral whorl and protect the developing flower bud.`,
      bract:`The bract of ${spec.name} is a modified leaf associated with the flower or inflorescence; it may be more conspicuous than the true flower.`,
      bracts:`The bracts of ${spec.name} are modified leaves surrounding or accompanying the flowers and may provide the main colour display.`,
      corona:`The corona of ${spec.name} is a central floral structure positioned inside the outer tepals and surrounding the reproductive organs.`,
      tepals:`The tepals of ${spec.name} are petal-like floral segments whose outer and inner whorls are not strongly differentiated.`,
      labellum:`The labellum of ${spec.name} is a specialised orchid lip that helps guide and position visiting pollinators.`,
      column:`The column of ${spec.name} is the fused reproductive structure that combines male and female floral organs, typical of orchids.`,
      pollinia:`The pollinia of ${spec.name} are compact masses of pollen transferred together during orchid pollination.`,
      flowerStalk:`The flower stalk of ${spec.name} supports the bloom or flower cluster and connects it to the vegetative shoot.`,
      velamen:`The velamen on ${spec.name} aerial roots is a multilayered spongy outer tissue that rapidly absorbs water and helps protect the root.`,
      frond:`The frond of ${spec.name} is a fern leaf, often divided into smaller pinnae and produced from the crown or rhizome.`,
      pinnae:`The pinnae of ${spec.name} are the smaller leaf divisions arranged along the central frond axis.`,
      rachis:`The rachis of ${spec.name} is the central axis of the compound frond or leaf, supporting its smaller leaf divisions.`,
      sori:`The sori of ${spec.name} are clusters of sporangia on fertile fronds where spores are produced.`,
      runner:`The runner of ${spec.name} is a horizontal stolon that extends away from the parent crown and can form new plantlets.`,
      plantlet:`The plantlet of ${spec.name} is a young vegetative clone that develops on a runner and can root independently.`,
      prickles:`The prickles of ${spec.name} are sharp epidermal outgrowths on the shoot; unlike true thorns, they are not modified branches.`,
      corm:`The corm of ${spec.name} is a swollen underground stem that stores carbohydrates and produces roots and new shoots.`,
      caudex:`The caudex of ${spec.name} is a swollen stem base that stores water and supports survival through dry periods.`,
      leaflets:`The leaflets of ${spec.name} are the individual divisions of a compound leaf, attached along a shared rachis.`,
      leafEpidermis:`The leaf epidermis of ${spec.name} forms the protective outer cell layer; its cuticle limits uncontrolled water loss.`,
      gel:`The inner gel tissue of ${spec.name} stores water within specialised leaf parenchyma cells.`,
      latex:`Latex-bearing tissues in ${spec.name} contain milky exudate that can help deter herbivores and seal wounds.`,
      crown:`The crown of ${spec.name} is the compact growing region where new leaves and shoots emerge.`,
      rosette:`The rosette of ${spec.name} is a circular arrangement of leaves arising close together from a shortened stem.`,
      waterTissue:`The water-storage tissue of ${spec.name} consists of enlarged succulent cells that retain water for use during dry conditions.`,
      epidermis:`The epidermis of ${spec.name} is the outer protective tissue covering the organ and regulating exchange with the environment.`,
      offset:`An offset of ${spec.name} is a short lateral shoot that can develop into a separate daughter plant.`
    };
    const note = spec.notes[key] || partStructures[key] || `${spec.name} develops a characteristic ${label.toLowerCase()} as part of its ${spec.category.toLowerCase()} growth form.`;
    const base = {
      leaf: {
        fn:`The ${label.toLowerCase()} captures light and regulates carbon dioxide, oxygen and water-vapour exchange in ${spec.name}.`,
        steps:[`The blade positions photosynthetic tissue to receive available light.`,`Stomata regulate carbon dioxide entry and water-vapour loss.`,`Chloroplasts use light energy to make sugars that support ${spec.name}'s growth.`],
        importance:`This foliage supplies carbohydrates for new leaves, roots and the characteristic growth habit of ${spec.name}.`,
        science:`${spec.latin} has species-specific leaf form and venation; the visible pattern reflects its vascular network.`
      },
      root: {
        fn:`The ${label.toLowerCase()} anchors ${spec.name} and takes up water and dissolved mineral nutrients.`,
        steps:[`Fine absorbing surfaces contact moisture around the growing medium.`,`Water enters root tissues by osmosis while mineral ions cross cell membranes.`,`Water and minerals enter xylem and move toward the shoot.`],
        importance:`A functioning root system maintains hydration, nutrient supply and physical stability for ${spec.name}.`,
        science:`Root branching and storage structures vary with species; ${spec.latin} has adaptations associated with its ${spec.category.toLowerCase()} habit.`
      },
      stem: {
        fn:`The ${label.toLowerCase()} supports the shoot and connects leaves, flowers and roots through vascular tissues.`,
        steps:[`Structural tissues keep the shoot upright or help it climb.`,`Xylem conducts water and minerals toward leaves.`,`Phloem distributes sugars from source tissues to growing and storage organs.`],
        importance:`This axis positions the foliage and links the organs that sustain ${spec.name}.`,
        science:`The stem architecture of ${spec.latin} reflects its ${spec.category.toLowerCase()} growth form.`
      },
      flower: {
        fn:`The ${label.toLowerCase()} contributes to pollination and sexual reproduction in ${spec.name}.`,
        steps:[`Floral structures mature and become available to pollinators or other pollen-transfer agents.`,`Pollen reaches a receptive stigma where a pollen tube may develop.`,`Fertilisation can lead to seed and fruit development.`],
        importance:`Reproductive structures allow ${spec.name} to produce offspring and maintain its species.`,
        science:`Floral organisation in ${spec.latin} follows the characteristic reproductive pattern of its plant family.`
      }
    }[group];
    const specialFn = spec.notes[`${key}Function`];
    const specialSteps = spec.notes[`${key}Steps`];
    return [
      `${spec.name} ${label}`,
      spec.latin,
      note,
      specialFn || base.fn,
      specialSteps || base.steps,
      base.importance,
      base.science,
      group==='leaf'?['Cuticle / epidermis','Photosynthetic tissue','Vascular bundle']:group==='root'?['Root surface','Cortex','Xylem and phloem']:group==='stem'?['Epidermis','Ground tissue','Xylem and phloem']:['Outer floral organs','Reproductive structures','Ovary / ovules']
    ];
  }
  Object.values(plants).forEach(p => { if(!p.categoryGroup) p.categoryGroup = /flower|bloom|bulb|shrub/i.test(p.category) ? 'Flowering Plants' : (/tropical|aroid|epiphyte/i.test(p.category) ? 'Tropical Plants' : 'Indoor Plants'); });
  extraPlantSpecs.filter(spec => selectedExtraPlantIds.has(spec.id)).forEach(spec => {
    if (plants[spec.id]) return;
    const parts = spec.parts;
    plants[spec.id] = {
      name:spec.name, latin:spec.latin, category:spec.category, categoryGroup: /flower|bloom|bulb|shrub|annual|perennial/i.test(spec.category) ? 'Flowering Plants' : (/tropical|aroid|epiphyte/i.test(spec.category) ? 'Tropical Plants' : (/ornamental|fern|succulent|palm/i.test(spec.category) ? 'Ornamental Plants' : 'Indoor Plants')),
      image:plantImages[spec.id].image, fallbackImage:plantImages[spec.id].fallbackImage, description:spec.description,
      light:spec.light, water:spec.water, humidity:spec.humidity, care:spec.care,
      parts, hotspots:spec.hotspots || parts.map((key,i)=>[key, ...([[52,25],[68,37],[40,50],[58,62],[35,72],[55,84],[70,88],[28,42]][i%8])])
    };
    details[spec.id] = {};
    parts.forEach(key => { details[spec.id][key] = makeExtraDetail(spec,key); });
  });

  // Transparent botanical specimen cut-outs. Each bundled PNG contains the full shoot,
  // a natural soil slice and the species-appropriate exposed root system. For species
  // without a supplied cut-out, retain the existing species-specific photo as fallback.
  const specimenAssets = {
    monstera: 'assets/specimens/monstera-soil-roots.png',
    peace: 'assets/specimens/peace-lily-soil-roots.png',
    snake: 'assets/specimens/snake-plant-soil-roots.png',
    money: 'assets/specimens/money-plant-soil-roots.png',
    tulip: 'assets/specimens/tulip-soil-roots.png',
    orchid: 'assets/specimens/orchid-soil-roots.png',
    fiddle: 'assets/specimens/fiddle-leaf-fig-specimen.png',
    rose: 'assets/specimens/rose-specimen.png',
    sunflower: 'assets/specimens/sunflower-specimen.png',
    jasmine: 'assets/specimens/jasmine-specimen.png'
  };
  Object.entries(plants).forEach(([id, plant]) => {
    plant.specimenImage = specimenAssets[id] || plant.image;
    plant.specimenHasTransparency = Boolean(specimenAssets[id]);
  });

  const processes=[
    {title:'Water Absorption',part:'roots',icon:'💧'},
    {title:'Nutrient Transport',part:'stem',icon:'🌱'},
    {title:'Photosynthesis',part:'leaf',icon:'☀️'},
    {title:'Respiration',part:'leaf',icon:'♻️'},
    {title:'Growth',part:'stem',icon:'🌿'},
    {title:'Transpiration',part:'stomata',icon:'💧'}
  ];
  // Species-specific traits make every process explanation respond to the selected specimen.
  const processTraits={
    monstera:{root:'soil roots together with aerial roots growing from the climbing nodes',water:'Aerial roots can take up moisture from humid air and nearby surfaces, while soil roots absorb water from the potting mix.',leaf:'large, mature leaves with fenestrations and a strong midrib',photo:'Its broad leaf blades contain chloroplast-rich mesophyll; the splits are a mature-leaf feature, not the site of photosynthesis itself.',growth:'a climbing vine that produces larger, increasingly fenestrated leaves as it matures',trans:'The large leaf surface releases water vapour through stomata, while aerial roots help the climbing plant attach to supports.'},
    peace:{root:'a dense, fibrous root system beneath its leafy crown',water:'Fine roots absorb water from evenly moist growing medium; the plant can show drooping leaves when its water supply is low.',leaf:'glossy lance-shaped leaves with a prominent midrib',photo:'The green leaf blades capture light and supply sugars that support new leaves and the white spathe-and-spadix inflorescence.',growth:'a clumping crown that produces new leaves and flower stalks from the base',trans:'Water evaporates from the broad leaf surfaces, so steady moisture and moderate humidity help maintain leaf turgor.'},
    snake:{root:'shallow roots and an underground rhizome',water:'Roots absorb water after the potting mix is allowed to dry; thick leaves store water for periods between watering.',leaf:'upright, thick, succulent-like leaves with water-storage tissue',photo:'Snake Plant uses crassulacean acid metabolism (CAM): stomata usually open at night to take in carbon dioxide, which is stored and used during daylight.',growth:'a slow-growing rosette or clump that expands through underground rhizomes',trans:'Its thick cuticle and CAM physiology reduce water loss; stomata generally open at night, limiting daytime transpiration.'},
    money:{root:'fine soil roots and small aerial roots that emerge at stem nodes',water:'Roots absorb water from the potting mix, and aerial roots help the vine cling to damp supports as it climbs.',leaf:'heart-shaped leaves carried along a flexible climbing or trailing vine',photo:'Chloroplasts in the green leaf tissue use light to produce sugars that support new vine sections and leaves.',growth:'a fast-growing vine that extends from nodes and can root where stems contact a suitable support',trans:'Water vapour diffuses from leaf stomata; the rate changes with light, humidity and how much water is available in the pot.'},
    tulip:{root:'adventitious roots that emerge from the basal plate of its bulb',water:'The seasonal root system absorbs water during active growth, while the bulb stores resources that help the plant survive dormancy.',leaf:'smooth, elongated leaves with parallel venation',photo:'During the growing season, leaf chloroplasts make sugars that are transported to and stored in the bulb for the next growth cycle.',growth:'a seasonal bulb plant whose stored reserves support the next shoot and cup-shaped flower',trans:'Water evaporates from the leaf stomata during active growth; the rate falls as foliage naturally senesces after flowering.'},
    orchid:{root:'thick aerial roots covered by a spongy velamen layer',water:'Velamen rapidly absorbs rainwater or moisture from the air and growing medium; the roots are adapted to an epiphytic lifestyle.',leaf:'fleshy leaves and aerial roots that are exposed to air rather than buried in ordinary soil',photo:'Green orchid leaves photosynthesise and supply sugars to the plant; some orchid tissues also contribute to storage between flowering periods.',growth:'a monopodial stem that produces leaves from the crown and flower spikes from mature growth',trans:'A waxy leaf surface and velamen-covered aerial roots help balance moisture uptake and water loss in an airy environment.'},
    fiddle:{root:'a woody root system that anchors the indoor tree in its growing medium',water:'Roots absorb water from the soil and supply the large leaves; allowing the upper growing medium to partly dry helps avoid waterlogging.',leaf:'large violin-shaped leaves with prominent pale lateral veins',photo:'The broad leaf blades provide a large photosynthetic surface, producing carbohydrates used by the woody trunk, branches and new foliage.',growth:'a woody upright trunk with branching shoots and large leaves emerging at nodes',trans:'Large leaves lose water through stomata; adequate root water and airflow help the tree maintain leaf function.'},
    rose:{root:'a branching root system that anchors woody canes and absorbs water from the soil',water:'Fine roots take up soil moisture and deliver it to new shoots, compound leaves and developing flower buds.',leaf:'compound leaves made of serrated leaflets with netted veins',photo:'The green leaflets are the main photosynthetic surfaces; the sugars they produce support woody canes, blooms and developing hips when pollinated.',growth:'a woody shrub that extends new canes, forms lateral shoots and produces flower buds',trans:'Water moves to the compound leaves and evaporates through stomata; this flow helps cool the foliage and maintain water movement.'},
    sunflower:{root:'a strong taproot with lateral roots that anchor its tall annual stem',water:'The taproot and lateral roots explore a large soil volume, helping supply water to the tall shoot and large flower head.',leaf:'broad, rough leaves arranged along a sturdy upright stem',photo:'The broad green leaves capture sunlight and make sugars that support rapid stem growth, flowering and seed filling in the composite head.',growth:'a fast-growing annual that builds a tall stem before developing its composite flower head and seeds',trans:'Large leaves release water vapour through stomata; transpiration contributes to the upward pull of water through the tall stem.'},
    jasmine:{root:'a branching root system that supports its shrub or climbing stems',water:'Roots absorb water from lightly moist soil and supply the glossy leaves and repeated flushes of fragrant flowers.',leaf:'glossy, usually opposite leaves with a clear midrib and branching veins',photo:'Leaf chloroplasts convert light energy into sugars that support flexible shoots and the energy-demanding production of fragrant blooms.',growth:'a flexible shrub or climber that extends new shoots and forms clusters of white fragrant flowers',trans:'Water evaporates from the glossy leaf surfaces through stomata; humidity and soil moisture influence the rate of loss.'}
  };
  let currentPlant='monstera',selectedPart='leaf',currentMode='labels',zoom=1,processIndex=0;

  const current=()=>plants[currentPlant];
  const detail=()=>details[currentPlant][selectedPart];
  const esc=(s)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function safeImage(url,alt,cls='',fallback='',style=''){
    return `<img class="${cls}" src="${esc(assetUrl(url))}" data-fallback="${esc(fallback ? assetUrl(fallback) : '')}" data-alt="${esc(alt)}" alt="${esc(alt)}" loading="eager" decoding="async" ${style?`style="${style}"`:''}>`;
  }
  function bindImageFallbacks(root){
    root.querySelectorAll('img[data-fallback]').forEach(img=>{
      const retry=()=>{
        if(img.dataset.fallback && img.dataset.fallbackUsed!=='1'){
          img.dataset.fallbackUsed='1';
          img.src=img.dataset.fallback;
          return;
        }
        img.classList.add('botanical-image-missing');
        img.alt=`${img.dataset.alt||'Plant'} image unavailable`;
        img.removeAttribute('src');
      };
      img.addEventListener('error',retry);
    });
  }
  function assignPlantImage(img,url,alt,focus='50% 50%',fallbackOverride=''){
    if(!img)return;
    img.onerror=null;
    img.classList.remove('botanical-image-missing');
    img.dataset.fallback=assetUrl(fallbackOverride || current().fallbackImage || '');
    img.dataset.fallbackUsed='0';
    img.alt=alt;
    img.style.objectPosition=focus;
    img.onerror=()=>{
      if(img.dataset.fallback && img.dataset.fallbackUsed!=='1'){
        img.dataset.fallbackUsed='1';
        img.src=img.dataset.fallback;
      }else{
        img.classList.add('botanical-image-missing');
        img.removeAttribute('src');
      }
    };
    img.src=assetUrl(url);
  }
  const plantOrder=['monstera','peace','snake','money','tulip','orchid','fiddle','rose','sunflower','jasmine'];
  const rootPartKeys=new Set(['roots','rootHair','aerial','velamen','rhizome','tuber','bulb','corm','caudex']);
  function renderLibrary(){
    const entries=plantOrder.filter(id=>plants[id]).map(id=>[id,plants[id]]);
    library.innerHTML=`<div class="botanical-plant-results" aria-live="polite">${entries.map(([id,p])=>`<button type="button" class="botanical-plant-chip ${id===currentPlant?'active':''}" data-plant="${id}" aria-pressed="${id===currentPlant}"><span class="botanical-chip-thumb">${safeImage(p.image,p.name,'',p.fallbackImage||'')}</span><span>${p.name}</span></button>`).join('')}</div>`;
    bindImageFallbacks(library);
  }
  function renderPlantInfo(){const p=current();plantInfo.innerHTML=`<div class="botanical-profile-emblem" aria-hidden="true">♧</div><p class="botanical-kicker">PLANT PROFILE · ${p.category}</p><h3>${p.name}</h3><p class="botanical-latin">${p.latin}</p><p class="botanical-description">${p.description}</p><div class="botanical-care-grid"><div><span>☼ &nbsp; LIGHT</span><strong>${p.light}</strong></div><div><span>◉ &nbsp; WATER</span><strong>${p.water}</strong></div><div><span>≋ &nbsp; HUMIDITY</span><strong>${p.humidity}</strong></div><div><span>▥ &nbsp; MAINTENANCE</span><strong>${p.care}</strong></div></div><button type="button" class="botanical-explore" data-action="labels">Explore Plant Anatomy <span>⟶</span></button>`;}
  function renderPartList(){
    const p=current(),d=detail();
    partList.innerHTML=`<div class="botanical-panel-heading"><span>DISCOVER THE STRUCTURE</span><strong>${p.name} Anatomy</strong></div><div class="botanical-part-list">${p.parts.map(key=>{const item=details[currentPlant][key],h=p.hotspots.find(x=>x[0]===key),focus=h?`${h[1]}% ${h[2]}%`:'50% 50%';return `<button type="button" class="botanical-part-item ${key===selectedPart?'active':''}" data-part="${key}" aria-pressed="${key===selectedPart}"><span class="botanical-part-thumb">${safeImage(p.image,p.name+' '+item[0],'',p.fallbackImage||'',`object-position:${focus};transform:scale(2.2)`)}</span><span><strong>${item[0]}</strong><small>${item[2]}</small></span><i>↗</i></button>`;}).join('')}</div><div class="botanical-selected-explanation"><p class="botanical-kicker">SELECTED ANATOMICAL STRUCTURE</p><h3>${p.name} · ${d[0]}</h3><p class="botanical-explanation-latin">${d[1]}</p><section><span>STRUCTURE</span><p>${d[2]}</p></section><section><span>BIOLOGICAL FUNCTION</span><p>${d[3]}</p></section><section><span>HOW IT WORKS</span><ol>${d[4].map(step=>`<li>${step}</li>`).join('')}</ol></section><section><span>IMPORTANCE TO THE PLANT</span><p>${d[5]}</p></section><section class="botanical-science-fact"><span>SCIENTIFIC INFORMATION</span><p>${d[6]}</p></section></div>`;
    bindImageFallbacks(partList);
  }
  function renderPartInfo(){renderPartList();}
  function renderHotspots(){const p=current();labels.innerHTML=p.hotspots.map(([key,x,y])=>{const d=details[currentPlant][key];if(!d)return '';return `<button type="button" class="botanical-hotspot botanical-arrow-hotspot ${key===selectedPart?'active':''}" style="left:${x}%;top:${y}%" data-part="${key}" aria-label="Explore ${p.name} ${d[0]}" aria-pressed="${key===selectedPart}"><span class="botanical-hotspot-dot"></span><span class="botanical-hotspot-line"></span><b>${d[0]}</b></button>`;}).join('');labels.classList.toggle('is-hidden',currentMode==='whole'||currentMode==='closeup'||currentMode==='roots');}
  function resetZoom(){zoom=1;imageLayer.style.transform='scale(1)';}
  function setImage(url,title,focus='50% 50%',fallback=''){assignPlantImage(mainImage,url,title,focus,fallback);imageCaption.textContent=title;resetZoom();}
  function setMode(mode){
    if(!['whole','labels','closeup','roots'].includes(mode))return;
    currentMode=mode;
    modes.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.mode===mode);b.setAttribute('aria-pressed',String(b.dataset.mode===mode));});
    const p=current();
    imageLayer.classList.remove('is-detail-view','is-specimen-view','is-root-view');
    if(mode==='whole'||mode==='labels'){
      imageLayer.classList.add('is-specimen-view');
      setImage(p.specimenImage||p.image,`${p.name} · complete plant with soil and root system`);
    }else if(mode==='closeup'){
      imageLayer.classList.add('is-detail-view');
      setImage(p.image,`${p.name} · ${detail()[0]} photographic close-up`,focusForPart());
    }else if(mode==='roots'){
      imageLayer.classList.add('is-specimen-view','is-root-view');
      // Prefer the bundled complete specimen so the exposed roots remain visible.
      setImage(p.specimenImage||p.image, `${p.name} · exposed root system and soil profile`, '50% 82%');
    }
    renderHotspots();
  }
  function focusForPart(){const h=current().hotspots.find(x=>x[0]===selectedPart);return h?`${h[1]}% ${h[2]}%`:'50% 50%';}
  function selectPart(key){
    if(!details[currentPlant][key])return;
    selectedPart=key;
    renderPartInfo();renderHotspots();
    const isRoot=rootPartKeys.has(key);
    const nextMode=isRoot?'roots':'closeup';
    setMode(nextMode);
  }
  function loadPlant(id){if(!plants[id])return;currentPlant=id;selectedPart=plants[id].parts[0];processIndex=0;renderLibrary();renderPlantInfo();renderPartInfo();setMode('labels');renderProcess();}
  function processContent(){
    const p=current(),t=processTraits[currentPlant],item=processes[processIndex];
    const data=[
      {definition:`Water absorption is how ${p.name} takes water from its growing medium through ${t.root}.`,why:`${t.water} This water keeps cells firm and supplies the tissues that are actively growing.`,steps:[`Moisture reaches the absorbing surfaces of ${t.root}.`,`Water enters root cells mainly by osmosis; dissolved mineral ions are taken up through membrane transport.`,`Water passes through the root cortex into xylem vessels.`,`Xylem carries water upward to the leaves and other active organs.`,`The plant uses this supply for photosynthesis, cell expansion and temperature regulation.`,],science:`Water potential gradients drive uptake. Root pressure may contribute, but transpiration pull is an important force moving water through xylem.`},
      {definition:`Nutrient transport moves dissolved mineral elements from the roots and distributes sugars made in the leaves throughout ${p.name}.`,why:`${t.water} Mineral nutrients support chlorophyll, enzymes and new tissues, while sugars provide energy and building material.`,steps:[`Root surfaces absorb mineral ions such as nitrate, phosphate, potassium and magnesium.`,`Water and dissolved minerals enter the xylem and move upward with the transpiration stream.`,`Leaves use the minerals to maintain photosynthesis and metabolism.`,`Phloem transports sucrose from source leaves to growing shoots, roots, flowers or storage tissues.`,`The plant redirects nutrients to the organs that are actively developing.`,],science:`Xylem mainly transports water and mineral ions; phloem translocates sugars and other organic solutes from source to sink tissues.`},
      {definition:`Photosynthesis allows ${p.name} to use light energy to make carbohydrate from carbon dioxide and water in its green tissues.`,why:`${t.photo} The sugars made in photosynthesis fuel maintenance, new growth and reproduction.`,steps:[`Chlorophyll in chloroplasts absorbs light energy.`,`Carbon dioxide enters the leaf through stomata.`,`Water arrives through the xylem from the roots.`,`Light-dependent reactions capture energy, and the Calvin cycle uses it to fix carbon into sugars.`,`Oxygen is released as a by-product, while sugars are used or transported to other organs.`,],science:`The overall process converts light energy into chemical energy. In most plants, carbon fixation follows the C3 pathway; Snake Plant uses CAM to reduce water loss.`},
      {definition:`Respiration is the process by which living cells in ${p.name} break down sugars to release usable energy (ATP).`,why:`Cells need ATP for active mineral uptake, growth, repair, transport and the maintenance of living tissues, including roots, stems, leaves and flowers.`,steps:[`Photosynthesis or stored reserves provide sugars such as glucose.`,`Cells break down sugars through glycolysis in the cytoplasm.`,`When oxygen is available, mitochondria continue aerobic respiration through the citric acid cycle and electron transport chain.`,`Energy is captured in ATP, which powers cellular work.`,`Respiration continues day and night in living tissues; it is different from photosynthesis.`,],science:`Aerobic cellular respiration releases energy from carbohydrates and produces carbon dioxide and water. It occurs in mitochondria in living plant cells.`},
      {definition:`Growth occurs when cells divide, expand and specialise, allowing ${p.name} to develop ${t.growth}.`,why:`Growth replaces older tissues, expands the plant's photosynthetic area and supports its characteristic form and reproduction.`,steps:[`Meristems at growing points produce new cells by mitosis.`,`New cells enlarge as they take up water and build cell walls.`,`Cells differentiate into tissues such as epidermis, xylem, phloem and photosynthetic mesophyll.`,`New organs develop according to the plant's growth pattern: ${t.growth}.`,`Light, water, minerals, temperature and plant hormones influence the rate and direction of growth.`,],science:`Primary growth is driven by apical meristems. In woody plants such as Rose and Fiddle-leaf Fig, lateral meristems also contribute to stem thickening.`},
      {definition:`Transpiration is the loss of water vapour from ${p.name}, mainly through stomata in its leaves.`,why:`${t.trans} Transpiration also helps draw water and dissolved minerals upward through the xylem.`,steps:[`Water moves from xylem into leaf tissues and moistens mesophyll cell walls.`,`Some of this water evaporates into the internal air spaces of the leaf.`,`Water vapour diffuses out through open stomata.`,`Water loss creates tension that helps pull a continuous column of water upward through xylem.`,`Guard cells adjust stomatal opening in response to light, carbon dioxide and water status.`,],science:`Transpiration rate is influenced by stomatal conductance, temperature, humidity, air movement and leaf area. CAM plants such as Snake Plant usually limit daytime water loss.`}
    ][processIndex];
    return {p,item,data};
  }
  function renderProcess(){
    if(!timeline||!processInfo)return;
    const {p,item,data}=processContent();
    timeline.querySelectorAll('[data-process]').forEach(b=>{const active=Number(b.dataset.process)===processIndex;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    processInfo.innerHTML=`<div class="botanical-process-media">${safeImage(p.image,`${p.name} plant photograph`,'botanical-process-image',p.fallbackImage||'')}</div><div class="botanical-process-copy"><p class="botanical-kicker">${esc(p.name.toUpperCase())} · BIOLOGICAL PROCESS ${processIndex+1} OF 6</p><h3>${esc(p.name)} – ${esc(item.title)}</h3><section><h4>WHAT IT MEANS</h4><p>${esc(data.definition)}</p></section><section><h4>HOW IT WORKS</h4><ol>${data.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol></section><section><h4>WHY IT IS IMPORTANT</h4><p>${esc(data.why)}</p></section><section class="botanical-process-science"><h4>SCIENTIFIC INFORMATION</h4><p>${esc(data.science)}</p></section></div>`;
    bindImageFallbacks(processInfo);
  }
  library.addEventListener('click',e=>{const b=e.target.closest('[data-plant]');if(b)loadPlant(b.dataset.plant);});
  partList.addEventListener('click',e=>{const b=e.target.closest('[data-part]');if(b)selectPart(b.dataset.part);});
  labels.addEventListener('click',e=>{const b=e.target.closest('[data-part]');if(b)selectPart(b.dataset.part);});
  modes.addEventListener('click',e=>{const b=e.target.closest('[data-mode]');if(b)setMode(b.dataset.mode);});
  plantInfo.addEventListener('click',e=>{if(e.target.closest('[data-action="labels"]'))setMode('labels');});
  if(timeline && processInfo){
    timeline.innerHTML=processes.map((p,i)=>`<button type="button" class="botanical-timeline-step ${i===processIndex?'active':''}" data-process="${i}"><span class="botanical-timeline-icon">${p.icon}</span><strong>${i+1}. ${p.title}</strong></button>`).join('');
    timeline.addEventListener('click',e=>{const b=e.target.closest('[data-process]');if(b){processIndex=Number(b.dataset.process);renderProcess();}});
    processInfo.addEventListener('click',e=>{if(e.target.closest('[data-process-prev]')){processIndex=Math.max(0,processIndex-1);renderProcess();}if(e.target.closest('[data-process-next]')){processIndex=Math.min(processes.length-1,processIndex+1);renderProcess();}});
  }
  $('anatomyZoomIn')?.addEventListener('click',()=>{zoom=Math.min(2.5,zoom+.15);imageLayer.style.transform=`scale(${zoom})`;});
  $('anatomyZoomOut')?.addEventListener('click',()=>{zoom=Math.max(1,zoom-.15);imageLayer.style.transform=`scale(${zoom})`;});
  $('anatomyZoomReset')?.addEventListener('click',resetZoom);
  $('anatomyFullscreen')?.addEventListener('click',()=>{if(stage.requestFullscreen)stage.requestFullscreen().catch(()=>{});});
  renderLibrary();renderPlantInfo();renderPartInfo();setMode('labels');renderProcess();
})();
