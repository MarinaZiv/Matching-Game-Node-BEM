console.log("Connected now!");
import express from "express";
const app = express();
const port = process.env.PORT || 4006;
app.use(express.static("public"));
app.use(express.json());

import gameRoutes from "./routes/gameRoutes";
app.use("/game", gameRoutes);

app.listen(port, () => {
  console.log(`Server listening on port ${port}, url: http://localhost:${port}/`);
});

