// app.ts
// Hono application with middleware and route mounts

import { Hono } from "hono";
import { cors } from "hono/cors";
import { errorHandler } from "./middleware/error-handler";
import { healthRoutes } from "./routes/health";
import { userRoutes } from "./routes/user";
import { featuresRoutes } from "./routes/features";
import { ingredientsRoutes } from "./routes/ingredients";
import { recipesRoutes } from "./routes/recipes";
import { collectionsRoutes } from "./routes/collections";
import { cookbooksRoutes } from "./routes/cookbooks";
import { mealPlansRoutes } from "./routes/meal-plans";
import { householdsRoutes } from "./routes/households";
import { groceryListsRoutes } from "./routes/grocery-lists";
import { pantryRoutes } from "./routes/pantry";

const app = new Hono().basePath("/api");

app.use("*", cors());
app.onError(errorHandler);

app.route("/health", healthRoutes);
app.route("/user", userRoutes);
app.route("/features", featuresRoutes);
app.route("/ingredients", ingredientsRoutes);
app.route("/recipes", recipesRoutes);
app.route("/collections", collectionsRoutes);
app.route("/cookbooks", cookbooksRoutes);
app.route("/meal-plans", mealPlansRoutes);
app.route("/households", householdsRoutes);
app.route("/grocery-lists", groceryListsRoutes);
app.route("/pantry", pantryRoutes);

export default app;
