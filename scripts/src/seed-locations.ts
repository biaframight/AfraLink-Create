import { db, statesTable, citiesTable } from "@workspace/db";

const southernNigeriaData: { region: string; state: string; cities: string[] }[] = [
  { region: "South West", state: "Lagos", cities: ["Lagos Island", "Ikeja", "Lekki", "Victoria Island", "Surulere", "Yaba", "Badagry", "Epe", "Ikorodu", "Apapa", "Mushin", "Oshodi"] },
  { region: "South West", state: "Ogun", cities: ["Abeokuta", "Sagamu", "Ijebu-Ode", "Ota", "Ilaro", "Shagamu", "Ifo", "Ewekoro"] },
  { region: "South West", state: "Oyo", cities: ["Ibadan", "Ogbomoso", "Oyo", "Iseyin", "Saki", "Eruwa", "Igbo-Ora", "Kisi"] },
  { region: "South West", state: "Osun", cities: ["Osogbo", "Ile-Ife", "Ilesa", "Ede", "Iwo", "Ikirun", "Inisa", "Offa"] },
  { region: "South West", state: "Ondo", cities: ["Akure", "Ondo City", "Owo", "Ikare", "Okitipupa", "Ore", "Ifon", "Idanre"] },
  { region: "South West", state: "Ekiti", cities: ["Ado-Ekiti", "Ikere", "Ikole", "Emure", "Ilawe", "Omuo", "Oye", "Ijero"] },
  { region: "South East", state: "Anambra", cities: ["Awka", "Onitsha", "Nnewi", "Ekwulobia", "Oguta Road", "Ihiala", "Aguleri", "Ogbaru"] },
  { region: "South East", state: "Imo", cities: ["Owerri", "Orlu", "Okigwe", "Mbaise", "Mbano", "Ideato", "Ikeduru", "Isu"] },
  { region: "South East", state: "Abia", cities: ["Umuahia", "Aba", "Ohafia", "Bende", "Ikwuano", "Isukwuato", "Isuikwuato", "Ugwunagbo"] },
  { region: "South East", state: "Enugu", cities: ["Enugu", "Nsukka", "Awgu", "Oji River", "Udi", "Agbani", "Ezeagu", "Igbo Eze"] },
  { region: "South East", state: "Ebonyi", cities: ["Abakaliki", "Afikpo", "Onueke", "Ezzamgbo", "Ishielu", "Ohaozara", "Ikwo", "Ivo"] },
  { region: "South South", state: "Rivers", cities: ["Port Harcourt", "Obio-Akpor", "Eleme", "Okrika", "Bonny", "Degema", "Ahoada", "Tai"] },
  { region: "South South", state: "Delta", cities: ["Warri", "Asaba", "Ughelli", "Sapele", "Agbor", "Oghara", "Abraka", "Ozoro"] },
  { region: "South South", state: "Bayelsa", cities: ["Yenagoa", "Ogbia", "Sagbama", "Ekeremor", "Southern Ijaw", "Kolokuma", "Brass", "Nembe"] },
  { region: "South South", state: "Akwa Ibom", cities: ["Uyo", "Eket", "Ikot Ekpene", "Oron", "Abak", "Ikot Abasi", "Ibeno", "Etinan"] },
  { region: "South South", state: "Cross River", cities: ["Calabar", "Ogoja", "Ikom", "Obudu", "Ugep", "Obudu", "Akamkpa", "Odukpani"] },
  { region: "South South", state: "Edo", cities: ["Benin City", "Auchi", "Ekpoma", "Uromi", "Igarra", "Igueben", "Okpella", "Ubiaja"] },
];

async function seed() {
  console.log("Seeding Southern Nigeria location data...");

  for (const entry of southernNigeriaData) {
    const [insertedState] = await db
      .insert(statesTable)
      .values({ name: entry.state, region: entry.region })
      .onConflictDoNothing()
      .returning();

    const stateId = insertedState?.id;
    if (!stateId) {
      console.log(`State ${entry.state} already exists, skipping cities`);
      continue;
    }

    for (const city of entry.cities) {
      await db
        .insert(citiesTable)
        .values({ name: city, stateId, stateName: entry.state })
        .onConflictDoNothing();
    }

    console.log(`  Seeded ${entry.state}: ${entry.cities.length} cities`);
  }

  console.log("Done seeding location data.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
