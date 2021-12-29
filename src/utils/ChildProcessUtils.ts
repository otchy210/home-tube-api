import { exec, ExecException } from 'child_process';

type ExecResult =
    | string
    | {
          error: ExecException | null;
          stdout: string;
          stderr: string;
      };

export const execPromise = (command: string): Promise<ExecResult> => {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject({ error, stdout, stderr });
            } else {
                resolve(stdout);
            }
        });
    });
};
