// Ready-made material so the app can be demoed without an API key.
export const sampleMaterial = {
  title: 'CPU Scheduling (Operating Systems)',
  source: 'sample',
  text: `CPU scheduling is the process by which an operating system decides which process in the ready queue gets the CPU next. Since a CPU can run only one process at a time, the scheduler is what creates the illusion of multitasking. The main goals are to maximize CPU utilization and throughput while minimizing waiting time, turnaround time and response time. Scheduling can be non-preemptive, where a process keeps the CPU until it finishes or blocks, or preemptive, where the OS can take the CPU away from a running process.

First Come First Served (FCFS) is the simplest algorithm: processes are served in the order they arrive. It is non-preemptive and easy to implement with a FIFO queue, but it suffers from the convoy effect, where short processes wait behind one long process, increasing average waiting time. Shortest Job First (SJF) picks the process with the smallest next CPU burst. It gives the minimum average waiting time among all algorithms, but it requires knowing burst times in advance and can starve long processes. Its preemptive version is called Shortest Remaining Time First (SRTF).

Round Robin (RR) is designed for time-sharing systems. Each process receives a fixed time slice called the time quantum, and if it does not finish, it is preempted and moved to the back of the ready queue. If the quantum is too large, RR behaves like FCFS; if it is too small, too much time is wasted on context switches. RR gives good response time and is fair to all processes.

In Priority Scheduling, each process is assigned a priority and the CPU is allocated to the highest-priority process. It can be preemptive or non-preemptive. Its main problem is starvation, where low-priority processes may never run. The standard solution is aging, which gradually increases the priority of processes that wait for a long time.`,
  summary: {
    overview:
      'CPU scheduling decides which ready process runs next so that one CPU can serve many programs. Different algorithms trade off waiting time, fairness and response time.',
    keyPoints: [
      'The scheduler picks the next process from the ready queue and creates the illusion of multitasking.',
      'Goals: high CPU utilization and throughput, low waiting, turnaround and response time.',
      'Non-preemptive scheduling lets a process keep the CPU until it ends or blocks; preemptive scheduling can take it away.',
      'FCFS is simple (FIFO) but suffers from the convoy effect.',
      'SJF gives the minimum average waiting time but needs burst times and can starve long jobs.',
      'Round Robin uses a time quantum, giving fair sharing and good response time.',
      'Priority scheduling can starve low-priority processes; aging fixes this.',
    ],
    topics: ['Scheduling Basics', 'FCFS and SJF', 'Round Robin', 'Priority Scheduling'],
  },
  flashcards: [
    { front: 'What does the CPU scheduler do?', back: 'Chooses which process in the ready queue gets the CPU next.', topic: 'Scheduling Basics' },
    { front: 'Preemptive vs non-preemptive scheduling?', back: 'Preemptive: the OS can take the CPU from a running process. Non-preemptive: the process keeps it until it finishes or blocks.', topic: 'Scheduling Basics' },
    { front: 'What is the convoy effect?', back: 'Short processes waiting behind one long process in FCFS, which raises the average waiting time.', topic: 'FCFS and SJF' },
    { front: 'Which algorithm gives minimum average waiting time?', back: 'Shortest Job First (SJF).', topic: 'FCFS and SJF' },
    { front: 'What is SRTF?', back: 'Shortest Remaining Time First - the preemptive version of SJF.', topic: 'FCFS and SJF' },
    { front: 'What is a time quantum?', back: 'The fixed time slice each process gets in Round Robin before being preempted.', topic: 'Round Robin' },
    { front: 'What happens if the time quantum is too small?', back: 'Too much time is wasted on context switching.', topic: 'Round Robin' },
    { front: 'What is aging?', back: 'Gradually increasing the priority of a waiting process so it does not starve.', topic: 'Priority Scheduling' },
  ].map((c) => ({ ...c, known: false })),
  quiz: [
    {
      question: 'Which scheduling algorithm is implemented using a simple FIFO queue?',
      options: ['Round Robin', 'First Come First Served', 'Shortest Job First', 'Priority Scheduling'],
      answerIndex: 1,
      topic: 'FCFS and SJF',
      explanation: 'FCFS serves processes strictly in the order they arrive, which is exactly a FIFO queue.',
    },
    {
      question: 'What is the main goal of the CPU scheduler?',
      options: [
        'Decide which ready process gets the CPU next',
        'Allocate memory to processes',
        'Handle file permissions',
        'Create new processes',
      ],
      answerIndex: 0,
      topic: 'Scheduling Basics',
      explanation: 'The scheduler selects one process from the ready queue to run on the CPU.',
    },
    {
      question: 'What problem does aging solve in Priority Scheduling?',
      options: ['Context-switch overhead', 'Convoy effect', 'Starvation of low-priority processes', 'Deadlock'],
      answerIndex: 2,
      topic: 'Priority Scheduling',
      explanation: 'Aging slowly raises the priority of waiting processes so they eventually run.',
    },
    {
      question: 'In Round Robin, what happens when the time quantum is very large?',
      options: [
        'It behaves like FCFS',
        'It behaves like SJF',
        'Response time becomes excellent',
        'Processes starve',
      ],
      answerIndex: 0,
      topic: 'Round Robin',
      explanation: 'With a huge quantum every process finishes in one slice, so order is first-come first-served.',
    },
    {
      question: 'A scheduler that can take the CPU away from a running process is called:',
      options: ['Non-preemptive', 'Cooperative', 'Preemptive', 'Batch'],
      answerIndex: 2,
      topic: 'Scheduling Basics',
      explanation: 'Preemptive scheduling lets the OS interrupt a running process.',
    },
    {
      question: 'Why is SJF hard to use in practice?',
      options: [
        'It has high context-switch cost',
        'It needs the next CPU burst time in advance',
        'It cannot be preemptive',
        'It ignores priorities completely',
      ],
      answerIndex: 1,
      topic: 'FCFS and SJF',
      explanation: 'SJF must know (or estimate) burst lengths beforehand, which is rarely possible.',
    },
    {
      question: 'Round Robin is mostly used in which kind of system?',
      options: ['Batch systems', 'Real-time hard systems', 'Time-sharing systems', 'Embedded firmware'],
      answerIndex: 2,
      topic: 'Round Robin',
      explanation: 'Fixed time slices give every user a fair share and quick response, ideal for time-sharing.',
    },
    {
      question: 'In priority scheduling, which process receives the CPU?',
      options: ['The one that arrived first', 'The shortest process', 'The one with the highest priority', 'A random process'],
      answerIndex: 2,
      topic: 'Priority Scheduling',
      explanation: 'The CPU is always given to the highest-priority ready process.',
    },
  ],
};
