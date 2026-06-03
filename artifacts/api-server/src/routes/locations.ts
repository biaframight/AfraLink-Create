import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, statesTable, citiesTable } from "@workspace/db";
import {
  ListStatesResponse,
  ListCitiesQueryParams,
  ListCitiesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/locations/states", async (_req, res): Promise<void> => {
  const states = await db.select().from(statesTable).orderBy(statesTable.name);
  res.json(ListStatesResponse.parse({ states }));
});

router.get("/locations/cities", async (req, res): Promise<void> => {
  const params = ListCitiesQueryParams.safeParse(req.query);

  let cities;
  if (params.success && params.data.state) {
    cities = await db.select().from(citiesTable).where(eq(citiesTable.stateName, params.data.state)).orderBy(citiesTable.name);
  } else {
    cities = await db.select().from(citiesTable).orderBy(citiesTable.name);
  }

  res.json(ListCitiesResponse.parse({ cities }));
});

export default router;
