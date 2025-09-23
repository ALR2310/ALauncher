use std::env;
use std::process::Command;

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() < 3 {
        eprintln!("Usage: mini_updater <installer_path> <app_path> [installer_args...]");
        std::process::exit(1);
    }

    let installer = &args[1];
    let app = &args[2];
    let installer_args = &args[3..];

    let status = Command::new(installer)
        .args(installer_args)
        .status()
        .expect("Failed to run installer");

    if !status.success() {
        eprintln!("Installer exited with code {:?}", status.code());
        std::process::exit(1);
    }

    Command::new(app).spawn().expect("Failed to restart app");
}
