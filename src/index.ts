import express from "express";
import { handler } from "./handler";

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/post-event", handler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on https://localhost:${PORT}`);
});
