const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");

const dbpath = path.join(__dirname, "todoApplication.db");

const app = express();
app.use(express.json());

let db = null;
const initializeServerAndDatabase = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeServerAndDatabase();

const convertReqOutput = (item) => {
  return {
    id: item.id,
    todo: item.todo,
    priority: item.priority,
    status: item.status,
    category: item.category,
    dueDate: item.due_date,
  };
};

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityAndCategoryProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  let { search_q = "", priority, status, category } = request.query;
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "DONE" ||
          status === "TO DO" ||
          status === "IN PROGRESS"
        ) {
          getTodosQuery = `
                            SELECT
                                *
                            FROM
                                todo 
                             WHERE
                                todo LIKE '%${search_q}%'
                                AND status = '${status}'
                                AND priority = '${priority}';`;
          data = await db.all(getTodosQuery);
          response.send(data.map((eachObj) => convertReqOutput(eachObj)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasPriorityAndCategoryProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          category === "WORK" ||
          category === "HOME" ||
          category === "LEARNING"
        ) {
          getTodosQuery = `
                            SELECT
                                *
                            FROM
                                todo 
                            WHERE
                                todo LIKE '%${search_q}%'
                                AND category = '${category}'
                                AND priority = '${priority}';`;
          data = await db.all(getTodosQuery);
          response.send(data.map((eachObj) => convertReqOutput(eachObj)));
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasCategoryAndStatusProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "DONE" ||
          status === "TO DO" ||
          status === "IN PROGRESS"
        ) {
          getTodosQuery = `
                            SELECT
                                *
                            FROM
                                todo 
                            WHERE
                                todo LIKE '%${search_q}%'
                                AND status = '${status}'
                                AND category = '${category}';`;
          data = await db.all(getTodosQuery);
          response.send(data.map((eachObj) => convertReqOutput(eachObj)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = `
                        SELECT
                            *
                        FROM
                            todo 
                        WHERE
                            todo LIKE '%${search_q}%'
                            AND priority = '${priority}';`;
        data = await db.all(getTodosQuery);
        response.send(data.map((eachObj) => convertReqOutput(eachObj)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;
    case hasStatusProperty(request.query):
      if (status === "DONE" || status === "TO DO" || status === "IN PROGRESS") {
        getTodosQuery = `
                        SELECT
                            *
                        FROM
                            todo 
                        WHERE
                            todo LIKE '%${search_q}%'
                            AND status = '${status}';`;
        data = await db.all(getTodosQuery);
        response.send(data.map((eachObj) => convertReqOutput(eachObj)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;
    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodosQuery = `
                        SELECT
                            *
                        FROM
                            todo 
                        WHERE
                            todo LIKE '%${search_q}%'
                            AND category = '${category}';`;
        data = await db.all(getTodosQuery);
        response.send(data.map((eachObj) => convertReqOutput(eachObj)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      getTodosQuery = `
                    SELECT
                        *
                    FROM
                        todo 
                    WHERE
                        todo LIKE '%${search_q}%';`;
      data = await db.all(getTodosQuery);
      response.send(data.map((eachObj) => convertReqOutput(eachObj)));
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(convertReqOutput(todo));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const getTodosBasedOndate = `
    SELECT * 
    FROM todo
    WHERE 
        due_date = '${format(new Date(date), "yyyy-MM-dd")}';`;
  const todos = await db.all(getTodosBasedOndate);
  response.send(todos.map((eachObj) => convertReqOutput(eachObj)));
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const updatedDate = format(new Date(dueDate), "yyyy-MM-dd");
  if (category === "WORK" || category === "HOME" || category === "LEARNING") {
    if (status === "DONE" || status === "TO DO" || status === "IN PROGRESS") {
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        const postTodoQuery = `
                                INSERT INTO
                                todo (id, todo, priority, status, category, due_date)
                                VALUES
                                (${id}, '${todo}', '${priority}', '${status}', '${category}', '${updatedDate}');`;

        await db.run(postTodoQuery);
        response.send("Todo Successfully Added");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Category");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body;

  if (category === "WORK" || category === "HOME" || category === "LEARNING") {
    if (status === "DONE" || status === "TO DO" || status === "IN PROGRESS") {
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        const updateTodoQuery = `
                                    UPDATE
                                        todo
                                    SET
                                        todo='${todo}',
                                        priority='${priority}',
                                        status='${status}',
                                        category='${category}',
                                        due_date='${dueDate}'
                                    WHERE
                                        id = ${todoId};`;

        await db.run(updateTodoQuery);
        response.send(`${updateColumn} Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Category");
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
