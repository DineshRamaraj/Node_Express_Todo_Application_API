const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const { format, isValid, toDate } = require("date-fns");

const app = express();

app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");
let database = null;

initializationDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
  }
};

initializationDbAndServer();

checkRequestData = async (request, response, next) => {
  const { search_q, status, priority, category, date } = request.query;
  const { todoId } = request.params;

  if (status !== undefined) {
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];

    if (statusArray.includes(status)) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (priority !== undefined) {
    const priorityArray = ["HIGH", "MEDIUM", "LOW"];

    if (priorityArray.includes(priority)) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];

    if (categoryArray.includes(category)) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (date !== undefined) {
    try {
      const myDate = new Date(date);
      const formattedDate = format(new Date(date), "yyyy-MM-dd");
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${myDate.getMonth() + 1}-${myDate.getDate()}`
        )
      );

      if ((await isValid(result)) === true) {
        request.date = formattedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }

  request.todoId = todoId;
  request.search_q = search_q;
  next();
};

checkRequestBodyData = async (request, response, next) => {
  const { id, todo, status, priority, category, dueDate } = request.body;
  const { todoId } = request.params;

  if (status !== undefined) {
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];

    if (statusArray.includes(status)) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (priority !== undefined) {
    const priorityArray = ["HIGH", "MEDIUM", "LOW"];

    if (priorityArray.includes(priority)) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];

    if (categoryArray.includes(category)) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (dueDate !== undefined) {
    try {
      const myDate = new Date(dueDate);
      const formattedDate = format(new Date(dueDate), "yyyy-MM-dd");
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${myDate.getMonth() + 1}-${myDate.getDate()}`
        )
      );

      if (await isValid(result)) {
        request.dueDate = formattedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }

  request.todoId = todoId;
  request.todo = todo;
  request.id = id;
  next();
};

// GET All TodoItem API

convertDbResponseToMyResponse = (obj) => {
  return {
    id: obj.id,
    todo: obj.todo,
    priority: obj.priority,
    status: obj.status,
    category: obj.category,
    dueDate: obj.due_date,
  };
};

app.get("/todos/", checkRequestData, async (request, response) => {
  const { search_q = "", status = "", priority = "", category = "" } = request;
  const selectTodoQuery = `
    SELECT
        *
    FROM
        todo
    WHERE
        todo LIKE '%${search_q}%'
        AND status LIKE '%${status}%' 
        AND priority LIKE '%${priority}%'
        AND category LIKE '%${category}%';`;

  const dbResponse = await database.all(selectTodoQuery);
  response.send(
    dbResponse.map((eachItem) => convertDbResponseToMyResponse(eachItem))
  );
});

// GET Specific TodoItem API

app.get("/todos/:todoId/", checkRequestData, async (request, response) => {
  const { todoId } = request;
  const selectTodoItem = `
        SELECT
            *
        FROM
            todo
        WHERE
            id=${todoId};`;
  const todoResponse = await database.get(selectTodoItem);
  response.send(convertDbResponseToMyResponse(todoResponse));
});

// GET Date API

app.get("/agenda/", checkRequestData, async (request, response) => {
  const { date } = request;

  const selectDateTodoItem = `
        SELECT * FROM
            todo
        WHERE
            due_date LIKE '%${date}%';`;

  const todoResponse = await database.all(selectDateTodoItem);
  response.send(
    todoResponse.map((eachItem) => convertDbResponseToMyResponse(eachItem))
  );
});

// POST Todo Item

app.post("/todos/", checkRequestBodyData, async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request;
  const addTodoItemQuery = `
        INSERT INTO
            todo(id, todo, priority, status, category, due_date)
        VALUES
            (${id}, '${todo}',
            '${priority}', '${status}', 
            '${category}', '${dueDate}');`;

  await database.run(addTodoItemQuery);
  response.send("Todo Successfully Added");
});

//Update Todo API-5

app.put("/todos/:todoId/", checkRequestBodyData, async (request, response) => {
  const { todoId } = request;

  const { priority, todo, status, category, dueDate } = request;

  //   console.log(priority, todo, status, dueDate, category);

  if (status !== undefined) {
    const updateTodoQuery = `
            UPDATE
                todo
            SET 
                status = '${status}'
            WHERE 
                id = ${todoId};`;
    await database.run(updateTodoQuery);
    response.send("Status Updated");
    return;
  } else if (priority !== undefined) {
    const updatePriorityQuery = `
            UPDATE
                todo
            SET 
                priority = '${priority}'
            WHERE 
                id = ${todoId};`;
    await database.run(updatePriorityQuery);
    response.send("Priority Updated");
  } else if (todo !== undefined) {
    const updateTodoQuery = `
            UPDATE
                todo
            SET 
                todo = '${todo}'
            WHERE 
                id = ${todoId};`;
    await database.run(updateTodoQuery);
    response.send("Todo Updated");
  } else if (category !== undefined) {
    const updateCategoryQuery = `
            UPDATE
                todo
            SET 
                category = '${category}'
            WHERE 
                id = ${todoId};`;
    await database.run(updateCategoryQuery);
    response.send("Category Updated");
  } else if (dueDate !== undefined) {
    const updateDateQuery = `
            UPDATE
                todo
            SET 
                due_date = '${dueDate}'
            WHERE 
                id = ${todoId};`;
    await database.run(updateDateQuery);
    response.send("Due Date Updated");
  }
});

// DELETE TodoItem API

app.delete("/todos/:todoId/", checkRequestData, async (request, response) => {
  const { todoId } = request;
  const deleteTodoItem = `
        DELETE FROM
            todo
        WHERE
            id = ${todoId};`;
  await database.run(deleteTodoItem);
  response.send("Todo Deleted");
});

module.exports = app;
