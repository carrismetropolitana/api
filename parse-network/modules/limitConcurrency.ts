export default function limitConcurrency(tasks: (() => Promise<unknown>)[], limit: number) {
  let active = 0;
  let index = 0;
  const results = Array.from({ length: tasks.length });
  const executing = [];

  return new Promise((resolve) => {
    const enqueue = () => {
      if (index === tasks.length) {
        if (active === 0) {
          resolve(results);
        }
        return;
      }

      while (active < limit && index < tasks.length) {
        const currentIndex = index++;
        const task = tasks[currentIndex];
        active++;
        task().then((result) => {
          results[currentIndex] = result;
          active--;
          enqueue();
        }).catch((error) => {
          results[currentIndex] = error; // Handle errors if necessary
          active--;
          enqueue();
        });

        executing.push(task);
      }
    };

    enqueue();
  });
}
