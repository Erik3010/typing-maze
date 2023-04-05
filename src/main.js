import "../css/style.css";
import TypingMaze from "./TypingMaze";

const canvas = document.querySelector("#canvas");

const typingMaze = new TypingMaze({ canvas });
typingMaze.init();
