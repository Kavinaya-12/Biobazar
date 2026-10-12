const readline = require("node:readline/promises");
const path = require("node:path");
const fs = require("node:fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const Product = require("../models/productModel");
const User = require("../models/userModel");
const { validClassification } = require("../services/productClassification");

function readDemoComparisonFields() {
  const csvPath = path.join(__dirname, "../sample-products/price-comparison-demo.csv");
  const rows = fs.readFileSync(csvPath, "utf8").trim().split(/\r?\n/);
  const header = rows.shift();
  if (header !== "sku,productCategory,productType,packageQuantity,packageUnit") throw new Error("Demo comparison CSV has an unexpected header.");
  const fields = new Map();
  for (const row of rows) {
    const [sku, productCategory, productType, quantityText, packageUnit] = row.split(",");
    const packageQuantity = Number(quantityText);
    if (!sku || fields.has(sku) || !Number.isFinite(packageQuantity) || packageQuantity <= 0 || !["g", "kg", "ml", "l", "piece", "count"].includes(packageUnit)) throw new Error(`Invalid or duplicate demo comparison row for ${sku || "unknown SKU"}.`);
    fields.set(sku, { productCategory, productType, packageQuantity, packageUnit });
  }
  return fields;
}

const demoComparisonFields = readDemoComparisonFields();

const previousSamples = [
  { id: "64a000000000000000000001", sku: "BB-DEV-SAMPLE-FOODS-001" },
  { id: "64a000000000000000000002", sku: "BB-DEV-SAMPLE-FOODS-002" },
  { id: "64a000000000000000000003", sku: "BB-DEV-SAMPLE-PERSONALCARE-001" },
  { id: "64a000000000000000000004", sku: "BB-DEV-SAMPLE-PERSONALCARE-002" },
  { id: "64a000000000000000000005", sku: "BB-DEV-SAMPLE-HOUSEHOLD-001" },
  { id: "64a000000000000000000006", sku: "BB-DEV-SAMPLE-HOUSEHOLD-002" },
  { id: "64a000000000000000000007", sku: "BB-DEV-SAMPLE-LIFESTYLE-001" },
  { id: "64a000000000000000000008", sku: "BB-DEV-SAMPLE-LIFESTYLE-002" },
];

const sampleImageUrls = {
  FOODS: [
    "https://images.pexels.com/photos/7655885/pexels-photo-7655885.jpeg",
    "https://images.pexels.com/photos/10111848/pexels-photo-10111848.jpeg",
    "https://images.pexels.com/photos/34940646/pexels-photo-34940646.jpeg",
    "https://images.pexels.com/photos/10817550/pexels-photo-10817550.jpeg",
    "https://images.pexels.com/photos/5149346/pexels-photo-5149346.jpeg",
    "https://images.pexels.com/photos/27850068/pexels-photo-27850068.jpeg",
    "https://images.pexels.com/photos/6287271/pexels-photo-6287271.jpeg",
    "https://images.pexels.com/photos/6220709/pexels-photo-6220709.jpeg",
    "https://images.pexels.com/photos/8646557/pexels-photo-8646557.jpeg",
    "https://images.pexels.com/photos/17236203/pexels-photo-17236203.jpeg",
    "https://images.pexels.com/photos/11350074/pexels-photo-11350074.jpeg",
    "https://images.pexels.com/photos/17453032/pexels-photo-17453032.jpeg",
    "https://images.pexels.com/photos/12932886/pexels-photo-12932886.jpeg",
    "https://images.pexels.com/photos/30431320/pexels-photo-30431320.jpeg",
    "https://images.pexels.com/photos/35553040/pexels-photo-35553040.jpeg",
    "https://images.pexels.com/photos/3682190/pexels-photo-3682190.jpeg",
    "https://images.pexels.com/photos/6072379/pexels-photo-6072379.jpeg",
    "https://images.pexels.com/photos/13184916/pexels-photo-13184916.jpeg",
    "https://images.pexels.com/photos/32795462/pexels-photo-32795462.jpeg",
    "https://images.pexels.com/photos/6252730/pexels-photo-6252730.jpeg",
  ],
  PERSONALCARE: [
    "https://images.pexels.com/photos/11757212/pexels-photo-11757212.jpeg",
    "https://images.pexels.com/photos/8129909/pexels-photo-8129909.jpeg",
    "https://images.pexels.com/photos/20336139/pexels-photo-20336139.jpeg",
    "https://images.pexels.com/photos/8681508/pexels-photo-8681508.jpeg",
    "https://images.pexels.com/photos/17596985/pexels-photo-17596985.jpeg",
    "https://images.pexels.com/photos/7262396/pexels-photo-7262396.jpeg",
    "https://images.pexels.com/photos/32152698/pexels-photo-32152698.jpeg",
    "https://images.pexels.com/photos/16378491/pexels-photo-16378491.jpeg",
    "https://images.pexels.com/photos/30595024/pexels-photo-30595024.jpeg",
    "https://images.pexels.com/photos/14438189/pexels-photo-14438189.jpeg",
    "https://images.pexels.com/photos/4735913/pexels-photo-4735913.jpeg",
    "https://images.pexels.com/photos/9324367/pexels-photo-9324367.jpeg",
    "https://media.istockphoto.com/id/2197780325/photo/aloe-gel-bottle-beauty-in-hand.jpg?b=1&s=612x612&w=0&k=20&c=lqG7usITAtf-u1tB-1U1mEVs_Xw0va8yXSlyhAPL5gw=",
    "https://images.pexels.com/photos/10997613/pexels-photo-10997613.jpeg",
    "https://images.pexels.com/photos/6728395/pexels-photo-6728395.jpeg",
    "https://images.pexels.com/photos/7262420/pexels-photo-7262420.jpeg",
    "https://images.pexels.com/photos/6815653/pexels-photo-6815653.jpeg",
    "https://images.pexels.com/photos/23940100/pexels-photo-23940100.jpeg",
    "https://images.pexels.com/photos/9379076/pexels-photo-9379076.jpeg",
    "https://images.pexels.com/photos/14470149/pexels-photo-14470149.jpeg",
  ],
};

const categories = [
  { category: "Foods", code: "FOODS", type: "Pantry", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=85", products: [
    ["Everyday Oat & Seed Mix", 249, "Oats and seeds come together in this pantry mix. Spoon it into a breakfast bowl, add it to a snack plate, or keep it ready for recipes that call for a grain-and-seed mix. The name identifies its main components; details such as proportions, sourcing, and preparation are not provided."],
    ["Roasted Chickpea Snack", 129, "Roasted chickpeas are presented as a ready-to-enjoy snack. Keep the pack with pantry foods for a small bite between meals or serve it as part of a snack spread. The listing identifies chickpeas and roasting, but does not specify seasoning, texture, ingredients, or serving size."],
    ["Red Lentil Pantry Pack", 179, "This pantry pack is identified as red lentils, a familiar pulse used in home cooking. Keep it with other staples for meals where lentils are part of the recipe, or use it when restocking the pantry. Origin and cooking guidance are not included in the product data."],
    ["Millet Breakfast Flakes", 219, "Millet flakes offer a cereal-style option for breakfast. Add them to a breakfast bowl or use them in a meal where flakes are called for. The name identifies millet and the flaked form; ingredients, preparation directions, and serving suggestions beyond that are not specified here."],
    ["Creamy Peanut Spread", 289, "A peanut spread with a creamy style, suited to the everyday uses of a spread: serve it with bread, fruit, or another snack, or include it in a recipe that calls for peanut spread. The listing does not state its ingredients, sweetness, texture beyond the name, or dietary suitability."],
    ["Cocoa Date Bites", 199, "These bite-sized snacks are named for dates and cocoa. Keep them on hand for a small sweet snack or include them on a shared snack plate. The product name gives the two highlighted components, but the full ingredient list, texture, and portion information are not provided."],
    ["Wholegrain Pasta Twists", 159, "Twist-shaped pasta identified as wholegrain makes a familiar pantry base for meals. Use it in a pasta dish of your choice, pairing it with ingredients or sauce already suited to your cooking. The listing does not provide grain varieties, cooking time, or other preparation details."],
    ["Golden Turmeric Blend", 139, "A turmeric blend for the pantry, named for its golden color and featured spice. Add it to a recipe that calls for turmeric or keep it with other cooking seasonings. The product data does not identify additional spices, proportions, flavor intensity, or suggested quantities."],
    ["Coconut Cooking Milk", 99, "Coconut cooking milk is a pantry ingredient for recipes that call for coconut milk. Keep it with cooking staples and add it to a dish according to your own recipe. The listing does not state the coconut content, consistency, package type, or whether the product includes anything beyond what its name specifies."],
    ["Stoneground Millet Flour", 189, "This flour is identified as millet flour made using stoneground processing. Keep it for baking or cooking recipes that call for millet flour, and use it as directed by the recipe you choose. The product data does not specify the millet variety, grind, or recipe instructions."],
    ["Trail Mix with Dried Fruit", 269, "A trail mix named for its dried-fruit component, suitable for packing as a snack or setting out with other small bites. The product name does not identify the mix's other components, ratios, or individual fruit varieties, so check the package for the complete ingredient details."],
    ["Crisp Rice & Seed Crackers", 149, "These crackers are named for rice and seeds, with a crisp style indicated by the product name. Serve them as a snack or alongside foods you already enjoy with crackers. The listing does not specify which seeds are included or the full ingredients."],
    ["Tomato Herb Cooking Sauce", 229, "A cooking sauce identified by tomato and herbs. Keep it among pantry ingredients for a meal where a tomato-and-herb sauce fits your recipe, or serve it with a dish of your choice. The product data does not list the herbs, other ingredients, texture, or preparation instructions."],
    ["Lemon Ginger Infusion", 169, "A lemon and ginger infusion for a warm or cool drink, depending on how you prepare it. Keep it with drinks and pantry staples for a citrus-and-ginger option. The listing does not specify the ingredients beyond its name, whether it is loose or bagged, or brewing directions."],
    ["Black Bean Pantry Pack", 159, "A pantry pack identified as black beans, for meals and recipes that call for this pulse. Keep it with everyday cooking staples and prepare it according to your preferred recipe. The product data does not state whether the beans are dried or prepared or provide cooking instructions."],
    ["Roasted Sesame Sprinkle", 119, "Roasted sesame seeds in sprinkle form, intended to be added to foods as a finishing topping. Keep it near other seasonings and use it wherever sesame suits the dish. The listing does not specify the sesame variety, seasoning, ingredient list, or suggested quantity."],
    ["Apple Cinnamon Porridge", 239, "A porridge named for apple and cinnamon, offering a breakfast-style pantry option. Prepare or serve it in the way that suits your routine, using any directions supplied on the package. The product data does not identify the full ingredients, sweetness, preparation time, or serving size."],
    ["Carob Oat Biscuits", 179, "Biscuits named for carob and oats, suitable for a snack or for serving with a drink. Keep them with pantry treats and choose a portion to suit the occasion. The product data does not give the full ingredient list, texture, sweetness, or number of biscuits in a pack."],
    ["Garden Vegetable Soup Mix", 209, "A soup mix identified with garden vegetables, for preparing a soup-style meal. Keep it among pantry meal starters and follow the preparation directions provided with the product. The listing does not specify which vegetables are included, whether anything else is added, or the number of servings."],
    ["Classic Chickpea Flour", 129, "Chickpea flour for recipes that call for this flour, including baking and other home-cooking uses. Keep it with pantry staples and measure it according to your chosen recipe. The listing identifies the flour but does not specify its grind, sourcing, or preparation guidance."],
  ]},
  { category: "PersonalCare", code: "PERSONALCARE", type: "Personal care", image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=85", products: [
    ["Daily Botanical Cleanser", 399, "A botanical cleanser named for daily personal-care routines. Place it alongside the other products you use for cleansing and follow the directions supplied with the item. The listing does not identify the botanicals, formula, skin type, or cleansing results, so those details should be checked on the product packaging."],
    ["Unscented Hand Balm", 279, "An unscented balm for hands, for people who prefer hand-care products without a stated fragrance. Keep it with everyday personal-care items and apply as directed on its packaging. The available product data does not specify its ingredients, texture, container, or suitability for particular skin needs."],
    ["Citrus Shampoo Bar", 329, "A shampoo bar with a citrus profile, offering a solid-format option for hair washing. Use it as part of a hair-care routine according to the directions provided with the product. The name does not specify the citrus ingredients, fragrance strength, hair type, or any particular hair-care result."],
    ["Gentle Oat Body Wash", 349, "A body wash whose name highlights oat and a gentle style. It can be part of a regular washing routine; follow the product's directions for use. The listing does not provide the full ingredient list, fragrance, skin suitability, or evidence for specific effects, so review the package for those details."],
    ["Calendula Body Lotion", 429, "A body lotion named for calendula, intended for use in a personal-care routine. Keep it with other body-care products and apply according to the directions supplied with the item. The available information does not identify the formula, calendula form, scent, skin type, or moisturizing performance."],
    ["Mint Toothpaste Tablets", 199, "Toothpaste tablets with a mint profile, presented in tablet form for a tooth-cleaning routine. Use them only as directed on the product packaging. The listing does not state the full ingredients, fluoride content, recommended amount, or dental claims; check the label and consult a dental professional for personal guidance."],
    ["Lavender Bath Soak", 259, "A bath soak named for lavender, for adding to a bath as part of a bathing routine. Follow the directions and quantity guidance supplied with the item. The product data does not specify whether it contains lavender oil, flowers, fragrance, or other ingredients, nor does it make claims about relaxation or skin effects."],
    ["Daily Mineral Sunscreen", 499, "A mineral sunscreen identified for daily use. Sunscreen directions and protection information are important, so read the package for its stated SPF, application guidance, reapplication interval, and suitability before use. Those specifications are not present in the listing, and no particular level of protection is implied here."],
    ["Rosemary Scalp Rinse", 369, "A scalp rinse named for rosemary, intended to fit into a hair-care routine. Use it according to the directions on its packaging. The current listing does not specify the rosemary form, formula, frequency of use, hair or scalp suitability, or any effect, so consult the product label for those details."],
    ["Shea Lip Conditioner", 149, "A lip conditioner named for shea, for inclusion in a personal lip-care routine. Keep it with everyday care items and follow the directions on the product packaging. The listing does not state the full ingredients, format, flavor, fragrance, or specific moisturizing effect."],
    ["Fragrance-free Face Cream", 459, "A face cream identified as fragrance-free. It can be considered as one step in a face-care routine, with use guided by the product label. The available data does not describe its other ingredients, texture, skin-type suitability, or results; check the packaging for full product and use information."],
    ["Coconut Hair Conditioner Bar", 349, "A solid hair conditioner bar named for coconut, for use in a hair-care routine. Follow the directions provided with the product to understand how it is intended to be applied. The listing does not specify the coconut ingredient, full formula, hair type, or conditioning results."],
    ["Aloe Hand Wash", 229, "A hand wash named for aloe, intended for everyday hand washing. Keep it near a sink or with other hand-care items and follow the directions supplied with the product. The listing does not identify the aloe form, other ingredients, scent, or any skin-care effect."],
    ["Soft Bristle Care Brush", 189, "A care brush identified by its soft bristles. Its name does not specify the intended body area, bristle material, handle construction, or dimensions, so review the product packaging to confirm the intended use. It may suit someone looking for a brush described as soft rather than firm."],
    ["Chamomile Cleansing Oil", 389, "A cleansing oil named for chamomile, for consideration in a personal cleansing routine. Follow the use instructions supplied with the product and check whether it is intended for face or body use. The listing does not provide the full formula, chamomile form, fragrance, skin suitability, or cleansing claims."],
    ["Daily Body Soap Bar", 159, "A body soap bar intended for use in a daily washing routine. Keep it among bathroom essentials and follow the directions shown on its packaging. The listing does not identify ingredients, scent, bar size, or suitability for a particular skin type."],
    ["Cooling Foot Balm", 299, "A foot balm described as cooling, for use as part of foot care. Apply only as directed on the product packaging. The available details do not specify the source of the cooling sensation, ingredients, intended frequency, or any therapeutic effect; the name alone does not establish a medical benefit."],
    ["Simple Face Wash Gel", 319, "A face wash in gel form, for a cleansing step in a face-care routine. Follow the directions on the item and check its ingredient list before use. The listing does not define what “simple” means, identify the formula, or state skin-type suitability or cleansing results."],
    ["Cedarwood Beard Oil", 349, "A beard oil named for cedarwood, for inclusion in a beard-care routine. Use according to the directions provided with the product. The listing does not specify whether cedarwood is an oil, scent, or other ingredient, and it gives no formula, application amount, or grooming results."],
    ["Unscented Body Butter", 479, "An unscented body butter for a body-care routine, identified by its rich product type and lack of stated scent. Apply as directed on the package. The product data does not list ingredients, texture beyond the product name, skin suitability, or moisturizing claims."],
  ]},
  { category: "Household", code: "HOUSEHOLD", type: "Household", image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=85", products: [
    ["Concentrated Dish Wash", 189, "A concentrated dish wash for kitchen cleanup. Use it according to the directions on its packaging and keep it with your dishwashing supplies. The listing does not state the formula, dilution ratio, scent, or cleaning performance, so refer to the product label for those details."],
    ["Reusable Cleaning Cloth Set", 229, "A set of reusable cleaning cloths for household cleaning tasks. Keep the cloths with your cleaning supplies and use them on suitable surfaces according to your own routine. The product data does not specify cloth material, dimensions, colors, count beyond the set description, or care instructions."],
    ["Citrus Surface Cleaner", 249, "A surface cleaner named for a citrus profile, intended for household cleaning. Check the packaging for which surfaces it is suitable for and how it should be used. The listing does not provide the formula, citrus source, fragrance details, safety instructions, or cleaning-performance claims."],
    ["Laundry Powder for Daily Loads", 379, "Laundry powder named for everyday loads, for use in a laundry routine. Follow the package instructions for the amount and washing method. The listing does not state the formula, suitable fabrics, machine compatibility, scent, or results, so consult the label before use."],
    ["Wool Dryer Ball Pair", 299, "A pair of dryer balls identified as wool, for use with laundry in a dryer if suitable for your items. Check any care guidance for the laundry and dryer before use. The listing does not state dimensions, wool origin, care instructions, or a specific effect on drying time or fabric."],
    ["Kitchen Scrub Brush", 179, "A scrub brush for kitchen cleaning, suitable for keeping with dish and surface-cleaning tools. Check the brush and the surface before use to ensure they are appropriate for one another. The product data does not specify bristle material, handle material, dimensions, or whether it is intended for dishes or other surfaces."],
    ["Refillable Room Mist Bottle", 329, "A refillable bottle intended for room mist. Use it with a compatible refill and follow the product's directions for filling and use. The listing does not include a mist, fragrance, bottle capacity, spray pattern, or supported refill types, so confirm compatibility before filling."],
    ["Unscented Floor Wash", 269, "An unscented floor wash for a household floor-cleaning routine. Check the packaging for dilution, application, and surface guidance before use. The listing does not identify its ingredients, compatible floor types, or cleaning results; those details should come from the product label."],
    ["Cotton Dish Towel Pair", 349, "A pair of dish towels identified as cotton, for everyday kitchen tasks such as drying dishes or wiping hands. Keep them with kitchen linens and follow any care information supplied with the product. The listing does not state dimensions, weave, color, or washing instructions."],
    ["Glass Food Storage Jar", 219, "A glass jar for food storage at home. Use it for foods that suit the jar and follow any handling or care guidance provided with the product. The listing does not state capacity, lid material, temperature limits, seal type, or whether it is suitable for appliances."],
    ["Plant-based Laundry Soap", 319, "Laundry soap described as plant-based, for use as part of a washing routine. Follow the package directions and check fabric-care labels before washing. The listing does not identify the plant-derived components, complete formula, scent, format, machine compatibility, or specific washing results."],
    ["Bamboo Handle Dustpan Set", 459, "A dustpan set whose name specifies a bamboo handle. Keep it with household cleaning tools for collecting dust and small sweepings. The listing does not describe the brush, other materials, dimensions, or included pieces beyond the set name, so check the product packaging for contents and care."],
    ["Bathroom Surface Spray", 239, "A spray for bathroom surfaces, intended for a bathroom-cleaning routine. Check the product label to confirm suitable surfaces, application steps, and any precautions before use. The listing does not specify ingredients, scent, spray contents, or performance claims."],
    ["Reusable Produce Bag Trio", 199, "A trio of reusable bags named for carrying produce. Keep them with shopping or kitchen supplies and use them for produce as appropriate. The listing does not identify materials, bag dimensions, closure type, care instructions, or capacity, so consult the packaging for those specifics."],
    ["Dishwasher Powder", 289, "A powder identified for dishwasher use. Follow the label for the amount and placement recommended for your appliance, and check compatibility with your dishwasher. The listing does not provide ingredients, scent, water conditions, or cleaning results."],
    ["Natural Fibre Pot Scrubber", 99, "A pot scrubber described as natural fibre, for kitchen cleaning. Check the surface and the scrubber before use to confirm they are suitable together. The product data does not identify the fibre, scrubber dimensions, care guidance, or whether it is intended for coated cookware."],
    ["Laundry Stain Bar", 139, "A bar named for laundry stains, to keep with laundry supplies for stain-treatment routines. Follow the package instructions and check the care label on the garment before use. The listing does not identify its ingredients, compatible fabrics, stain types, or expected results."],
    ["Multi-purpose Cleaning Concentrate", 399, "A cleaning concentrate described for multiple household uses. Follow the product label for any dilution, application, and surface instructions before using it. The listing does not specify which surfaces or tasks are supported, the formula, concentration ratio, or cleaning performance."],
    ["Linen Storage Basket", 549, "A storage basket named for linen, for organizing household items or linens at home. Place it where a basket is useful for keeping belongings together. The product data does not state its exact material, dimensions, capacity, construction, or care requirements."],
    ["Re-fillable Hand Soap Bottle", 279, "A refillable bottle intended for hand soap. Keep it near a handwashing area and refill it with a compatible soap according to the product instructions. The listing does not specify capacity, pump type, included soap, or which refill containers fit."],
  ]},
  { category: "Lifestyle", code: "LIFESTYLE", type: "Lifestyle", image: "https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=900&q=85", products: [
    ["Everyday Carry Tote", 349, "An everyday tote for carrying personal belongings. Use it for errands or to keep items together while you are out. The listing does not specify the tote's material, dimensions, closure, capacity, or care instructions, so check the product information for those details before choosing how to use it."],
    ["Desk-side Water Bottle", 499, "A water bottle named for keeping beside a desk. It can be placed with your everyday work or study items and used according to its product directions. The listing does not provide capacity, construction material, insulation, lid style, or care guidance."],
    ["Pocket Sketch Notebook", 179, "A pocket-sized notebook intended for sketches. Keep it with everyday stationery for drawing or jotting down ideas when convenient. The listing does not state page count, paper type, binding, dimensions, or whether it includes any accessories."],
    ["Insulated Lunch Container", 629, "A lunch container identified as insulated, for carrying a meal. Follow the product's directions for use and care, and check any food-safety or temperature guidance on its packaging. The listing does not state capacity, insulation duration, materials, compartments, or temperature performance."],
    ["Foldable Market Bag", 229, "A market bag designed to fold, for carrying purchases or everyday items. Keep it with your shopping belongings and open it when you need a bag. The listing does not provide its material, dimensions, capacity, folding method, or care information."],
    ["Cork Desk Mat", 579, "A desk mat named for cork, intended to sit on a work or study surface. Use it to define a space for desk activities and follow any care instructions supplied with the item. The listing does not specify its dimensions, backing, finish, or supported surfaces."],
    ["Travel Cutlery Case", 269, "A case for carrying cutlery while travelling or away from home. Place the cutlery you intend to carry inside, following any care guidance for the case. The listing does not state which utensils are included, the case material, dimensions, or capacity."],
    ["Reusable Coffee Cup", 399, "A reusable cup for coffee, suitable for carrying as part of an everyday routine. Check the product directions for how to use, clean, and transport it. The listing does not specify cup capacity, material, lid design, heat retention, or leak resistance."],
    ["Everyday Pencil Set", 119, "A set of pencils for writing, sketching, or keeping with daily stationery. Use them for notes and other paper-based tasks that suit a pencil. The listing does not state the number of pencils, lead grade, color, eraser inclusion, or packaging details."],
    ["Compact Yoga Strap", 329, "A compact strap named for yoga practice. Keep it with exercise accessories and use it only in ways appropriate to the product and your practice. The listing does not specify the strap's length, material, adjustment method, weight limit, or supported exercises."],
    ["Canvas Book Sleeve", 289, "A book sleeve identified as canvas, for holding a book when carrying or storing it. Check the sleeve dimensions against your book before use. The listing does not state exact measurements, lining, closure, or which book formats will fit."],
    ["Pocket Seed Journal", 199, "A pocket-sized journal named for seeds, for keeping notes or observations in a small notebook. Carry it with everyday stationery and use it for writing as needed. The listing does not describe its page layout, paper, binding, dimensions, or any included seed materials."],
    ["Weekend Packing Pouch", 459, "A packing pouch for organizing belongings for a weekend away. Use it to group items in your bag or luggage according to your travel routine. The listing does not specify the pouch's material, dimensions, closure, capacity, or water resistance."],
    ["Bamboo Phone Stand", 249, "A phone stand named for bamboo, intended to hold a phone in a position convenient for viewing. Check that your device fits securely and follow any setup or care guidance provided. The listing does not specify dimensions, supported device sizes, angle adjustment, or charging access."],
    ["Reusable Snack Wrap", 159, "A reusable wrap named for carrying snacks. Use it to wrap suitable food items and follow the product's cleaning and care directions. The listing does not state its material, dimensions, closure, food compatibility, or how it should be washed."],
    ["Lightweight Picnic Blanket", 799, "A picnic blanket described as lightweight, for taking along to outdoor meals or outings. Fold and carry it according to its design and follow any care directions supplied with the product. The listing does not provide dimensions, fabric, backing, water resistance, or packed weight."],
    ["Minimal Key Ring", 99, "A minimal key ring for keeping keys together. Add keys according to the ring's design and carry it with your everyday belongings. The listing does not specify the material, finish, dimensions, capacity, or included keys."],
    ["Adjustable Reading Light", 699, "A reading light with an adjustable design, for positioning near reading material. Set it up according to the product instructions and observe any power or safety information on its packaging. The listing does not state the light source, brightness, power method, adjustability range, or included accessories."],
    ["Daily Planner Pad", 219, "A planner pad for organizing daily notes or plans on paper. Keep it with desk or stationery supplies and use its pages as needed. The listing does not specify the page layout, sheet count, dimensions, paper type, or whether the pad is dated."],
    ["Travel Wash Kit Pouch", 379, "A pouch named for carrying a travel wash kit. Use it to group personal-care items while packing, checking product rules for any liquids you carry. The listing does not state the pouch's dimensions, material, compartments, closure, or leak protection."],
  ]},
];

const previousIds = new Map(previousSamples.map((sample) => [sample.sku, sample.id]));
let nextSampleId = 9;
const samples = categories.flatMap((group, categoryIndex) => group.products.map(([title, price, detail], productIndex) => {
  const sku = "BB-DEV-SAMPLE-" + group.code + "-" + String(productIndex + 1).padStart(3, "0");
  const id = previousIds.get(sku) || (0x64a000000000000000000000n + BigInt(nextSampleId++)).toString(16).padStart(24, "0");
  const palette = { Foods: ["#9d613f", "#f2e9d8"], PersonalCare: ["#9a6970", "#f4e9e8"], Household: ["#637c68", "#e8eee6"], Lifestyle: ["#67738e", "#e8ebf2"] }[group.category];
  const safeTitle = title.replace(/[&<>\"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" })[character]);
  const artVariants = ["<path d=\"M390 270h120v35h-120zM355 305h190v185q0 45-45 45h-100q-45 0-45-45z\" fill=\"none\" stroke=\"COLOR\" stroke-width=\"18\" stroke-linejoin=\"round\"/>", "<path d=\"M340 430q110-180 220 0-110 150-220 0z\" fill=\"none\" stroke=\"COLOR\" stroke-width=\"18\"/><path d=\"M385 460q55-55 125-90\" stroke=\"COLOR\" stroke-width=\"14\"/>", "<path d=\"M355 330h190v185h-190zM380 290h140v40h-140z\" fill=\"none\" stroke=\"COLOR\" stroke-width=\"18\" stroke-linejoin=\"round\"/>", "<path d=\"M355 350h190v145q0 45-45 45h-100q-45 0-45-45zM385 350v-55h130v55\" fill=\"none\" stroke=\"COLOR\" stroke-width=\"18\" stroke-linejoin=\"round\"/>", "<circle cx=\"450\" cy=\"410\" r=\"100\" fill=\"none\" stroke=\"COLOR\" stroke-width=\"18\"/><path d=\"M450 310v200M350 410h200\" stroke=\"COLOR\" stroke-width=\"14\" opacity=\".7\"/>"];
  const artwork = artVariants[productIndex % artVariants.length].replaceAll("COLOR", palette[0]);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900"><rect width="900" height="900" fill="${palette[1]}"/><circle cx="450" cy="390" r="245" fill="#fff" opacity=".76"/><rect x="190" y="155" width="520" height="475" rx="64" fill="${palette[1]}" stroke="${palette[0]}" stroke-width="18"/><g>${artwork}</g><text x="450" y="710" text-anchor="middle" font-family="Arial,sans-serif" font-size="32" font-weight="700" fill="${palette[0]}">${group.category === "PersonalCare" ? "BODY &amp; CARE" : group.category.toUpperCase()}</text><text x="450" y="765" text-anchor="middle" font-family="Arial,sans-serif" font-size="25" fill="#343b33">${safeTitle}</text></svg>`;
  const comparisonFields = demoComparisonFields.get(sku);
  if (!comparisonFields || !validClassification({ collec: group.category, ...comparisonFields })) throw new Error(`Missing or invalid comparison fields for synthetic product ${sku}.`);
  return { id, sku, name: title, type: group.type, collec: group.category, ...comparisonFields, price,
    description: detail, image: sampleImageUrls[group.code]?.[productIndex] || ("data:image/svg+xml," + encodeURIComponent(svg)),
    inventoryQuantity: 8 + ((categoryIndex * 17 + productIndex * 11) % 73) };
}));

function fail(message) {
  throw new Error(message);
}

function getVerifiedTarget() {
  if (process.env.NODE_ENV !== "development") fail("NODE_ENV must be exactly 'development'. No database connection was made.");
  const uri = process.env.MONGO_URI;
  const expectedHost = (process.env.DEV_SEED_MONGODB_HOST || "").trim().toLowerCase();
  const expectedDatabase = (process.env.DEV_SEED_DATABASE_NAME || "").trim();
  const ownerEmail = (process.env.DEV_SEED_OWNER_EMAIL || "").trim().toLowerCase();
  const allowUpdatedbiobazaar = process.env.DEV_SEED_ALLOW_UPDATEDBIOBAZAAR === "true";
  if (!uri || !expectedHost || !expectedDatabase || !ownerEmail) {
    fail("Set MONGO_URI, DEV_SEED_MONGODB_HOST, DEV_SEED_DATABASE_NAME, and DEV_SEED_OWNER_EMAIL in backend/.env. No database connection was made.");
  }

  let parsed;
  try { parsed = new URL(uri); } catch { fail("MONGO_URI is not a valid MongoDB URI. No database connection was made."); }
  const uriDatabase = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  if (!["mongodb:", "mongodb+srv:"].includes(parsed.protocol)) fail("MONGO_URI must use mongodb:// or mongodb+srv://. No database connection was made.");
  if (parsed.hostname.toLowerCase() !== expectedHost) fail("MONGO_URI host does not match DEV_SEED_MONGODB_HOST. No database connection was made.");
  if (!uriDatabase || uriDatabase !== expectedDatabase) fail("MongoDB URI database does not match DEV_SEED_DATABASE_NAME. No database connection was made.");
  const clearlyDevelopmentDatabase = /(^|[-_])(dev|development)([-_]|$)/i.test(uriDatabase);
  const explicitlyAllowedDatabase = uriDatabase === "Updatedbiobazaar" && expectedDatabase === "Updatedbiobazaar" && allowUpdatedbiobazaar;
  if (!clearlyDevelopmentDatabase && !explicitlyAllowedDatabase) {
    fail("Database name must visibly contain 'dev' or 'development'. For the exact database Updatedbiobazaar, explicitly set DEV_SEED_ALLOW_UPDATEDBIOBAZAAR=true. No database connection was made.");
  }
  return { uri, host: parsed.hostname, database: uriDatabase, ownerEmail };
}

async function main() {
  if (categories.length !== 4 || categories.some((group) => group.products.length !== 20) || samples.length !== 80) {
    fail("Sample catalogue must contain exactly 20 products in each of four categories.");
  }
  if (new Set(samples.map((sample) => sample.id)).size !== samples.length || new Set(samples.map((sample) => sample.sku)).size !== samples.length) {
    fail("Sample product IDs and SKUs must be unique.");
  }
  const target = getVerifiedTarget();
  const dryRun = process.argv.includes("--dry-run");
  await mongoose.connect(target.uri);
  if (mongoose.connection.name !== target.database) fail("Connected database name did not match the development target. No writes were made.");

  const owner = await User.findOne({ email: target.ownerEmail }).select("_id").lean();
  if (!owner) fail("The configured development owner email does not match an existing user. No user or product was created.");

  const records = samples.map((sample) => ({
    _id: new mongoose.Types.ObjectId(sample.id),
    name: sample.name,
    type: sample.type,
    price: sample.price,
    description: sample.description,
    collec: sample.collec,
    productCategory: sample.productCategory,
    productType: sample.productType,
    packageQuantity: sample.packageQuantity,
    packageUnit: sample.packageUnit,
    image: sample.image,
    certification: "",
    ingredients: "",
    packaging: "",
    reusable: "",
    recyclable: "",
    evidenceNotes: "",
    sellerProfile: null,
    sku: sample.sku,
    inventoryQuantity: sample.inventoryQuantity,
    shippingDetails: "Development sample; not for sale.",
    status: "published",
    userId: owner._id,
  }));

  for (const record of records) await new Product(record).validate();
  const ids = records.map((record) => record._id);
  const existing = await Product.find({ _id: { $in: ids } }).select("_id sku name description collec productCategory productType packageQuantity packageUnit price inventoryQuantity status").lean();
  const byId = new Map(existing.map((product) => [String(product._id), product]));
  const conflicts = records.filter((record) => {
    const found = byId.get(String(record._id));
    return found && found.sku !== record.sku;
  });
  if (conflicts.length) fail("A stable sample ID is already used by a different product. No products were written; inspect the conflicting records manually.");
  const pending = records.filter((record) => !byId.has(String(record._id)));
  const comparisonFieldNames = ["productCategory", "productType", "packageQuantity", "packageUnit"];
  const missingPackageDescription = /\b(?:pack(?:age)?\s+(?:size|weight|quantity)|container\s+size)\b/i;
  const toRefresh = records.filter((record) => {
    const found = byId.get(String(record._id));
    return found && found.sku === record.sku && (comparisonFieldNames.some((field) => found[field] !== record[field]) || (missingPackageDescription.test(found.description || "") && !missingPackageDescription.test(record.description || "")));
  });

  console.log(`Development target: ${target.host}/${target.database}`);
  console.log(`Sample products already present: ${records.length - pending.length}; new products: ${pending.length}; total sample set: ${records.length}.`);
  console.log(`Existing fictional samples needing demo metadata refresh: ${toRefresh.length}. Only classification, package fields, and any stale description that says package size is missing will be refreshed.`);
  const eligibleGroups = new Map();
  for (const product of existing) {
    const unit = ["g", "kg"].includes(product.packageUnit) ? "mass" : ["ml", "l"].includes(product.packageUnit) ? "volume" : ["piece", "count"].includes(product.packageUnit) ? "count" : "invalid";
    if (unit === "invalid" || !(Number(product.price) > 0) || !(Number(product.inventoryQuantity) > 0) || (product.status && product.status !== "published") || !validClassification(product)) continue;
    const key = [product.collec, product.productCategory, product.productType, unit].join("/");
    eligibleGroups.set(key, (eligibleGroups.get(key) || 0) + 1);
  }
  const comparisonGroups = [...eligibleGroups].filter(([, count]) => count >= 4).map(([group, count]) => `${group}: ${count} listings / ${count - 1} alternatives`);
  console.log(`Existing samples with valid classification and package fields: ${existing.filter((product) => validClassification(product) && Number(product.packageQuantity) > 0 && product.packageUnit).length}/${existing.length}.`);
  console.log(`Existing sample groups meeting the default threshold: ${comparisonGroups.length ? comparisonGroups.join("; ") : "none"}.`);
  const summaries = categories.map((group) => {
    const categoryRecords = records.filter((record) => record.collec === group.category);
    const newCount = categoryRecords.filter((record) => !byId.has(String(record._id))).length;
    return { category: group.category, total: categoryRecords.length, newCount, existingCount: categoryRecords.length - newCount };
  });
  for (const summary of summaries) console.log(summary.category + ": " + summary.newCount + " would be inserted; " + summary.existingCount + " already exist; " + summary.total + " total.");
  console.log("Total: " + pending.length + " would be inserted; " + (records.length - pending.length) + " already exist; " + records.length + " total.");
  if (dryRun) {
    console.log("Dry run complete. No database writes were made.");
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(`Type SEED ${target.database} to insert missing samples and refresh comparison fields on exact matching fictional samples: `);
    if (answer !== `SEED ${target.database}`) {
      console.log("Confirmation did not match. No database writes were made.");
      return;
    }
  } finally { rl.close(); }

  if (!pending.length && !toRefresh.length) {
    console.log("All development samples are already present. Nothing was written.");
    return;
  }
  const inserts = pending.map((record) => {
    const { _id, ...insertOnlyFields } = record;
    return { updateOne: { filter: { _id }, update: { $setOnInsert: insertOnlyFields }, upsert: true } };
  });
  const refreshes = toRefresh.map((record) => {
    const found = byId.get(String(record._id));
    const fields = Object.fromEntries(comparisonFieldNames.map((field) => [field, record[field]]));
    if (missingPackageDescription.test(found?.description || "") && !missingPackageDescription.test(record.description || "")) fields.description = record.description;
    return { updateOne: { filter: { _id: record._id, sku: record.sku }, update: { $set: fields } } };
  });
  const result = await Product.bulkWrite([...inserts, ...refreshes], { ordered: true });
  console.log(`Inserted ${result.upsertedCount} new fictional samples and refreshed comparison fields on ${result.modifiedCount} existing fictional samples. Prices, inventory, images, ownership, IDs, and other fields were unchanged.`);
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(`Development product seeding stopped: ${error.message}`);
      process.exitCode = 1;
    })
    .finally(async () => { await mongoose.disconnect().catch(() => {}); });
}

module.exports = { samples, categories, getVerifiedTarget, readDemoComparisonFields };
