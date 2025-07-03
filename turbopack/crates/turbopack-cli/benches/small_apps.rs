#![cfg_attr(not(codspeed), allow(unused))]

#[global_allocator]
static ALLOC: turbo_tasks_malloc::TurboMalloc = turbo_tasks_malloc::TurboMalloc;

use std::{
    fs::OpenOptions,
    io::Write,
    path::{Path, PathBuf},
    process::Command,
};

use criterion::{BenchmarkId, Criterion, criterion_group, criterion_main};
use turbo_tasks_malloc::AllocationInfo;
use turbopack_cli::{
    arguments::{BuildArguments, CommonArguments},
    register,
};

fn list_apps() -> (PathBuf, Vec<PathBuf>) {
    // We need to rely on `CARGO_MANIFEST_DIR` because we are running it via `cargo codspeed`

    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let apps_dir = Path::new(&manifest_dir)
        .join("../../benchmark-apps")
        .canonicalize()
        .expect("failed to canonicalize path");

    let mut apps = Vec::new();

    for entry in std::fs::read_dir(&apps_dir).unwrap() {
        let entry = entry.unwrap();
        let path = entry.path();
        if path.is_dir() {
            // Exclude node_modules
            if path.file_name().unwrap_or_default() == "node_modules" {
                continue;
            }

            apps.push(path);
        }
    }

    (apps_dir, apps)
}

fn bench_small_apps(c: &mut Criterion) {
    use turbo_tasks_malloc::TurboMalloc;

    register();

    let (apps_dir, apps) = list_apps();
    let mut g = c.benchmark_group("turbopack/build/apps");
    let mut benchmark_results = Vec::new();

    for app in apps {
        g.bench_function(
            BenchmarkId::new("build", app.file_name().unwrap().to_string_lossy()),
            |b| {
                let apps_dir = apps_dir.clone();
                let app = app.clone();

                let app_name = app.file_name().unwrap().to_string_lossy().to_string();

                let mut allocations = vec![];
                b.iter(|| {
                    let apps_dir = apps_dir.clone();
                    let app = app.clone();
                    let app_name = app_name.clone();

                    let mut rt = tokio::runtime::Builder::new_multi_thread();
                    rt.enable_all().on_thread_stop(|| {
                        TurboMalloc::thread_stop();
                    });
                    let rt = rt.build().unwrap();

                    let allocation_counters = TurboMalloc::allocation_counters();

                    rt.block_on(async move {
                        turbopack_cli::build::build(&BuildArguments {
                            common: CommonArguments {
                                entries: Some(vec![format!("{app_name}/index.tsx")]),
                                dir: Some(app.clone()),
                                root: Some(apps_dir),
                                log_level: None,
                                show_all: false,
                                log_detail: false,
                                full_stats: false,
                                target: None,
                            },
                            no_sourcemap: false,
                            no_minify: false,
                            force_memory_cleanup: true,
                            no_scope_hoist: false,
                        })
                        .await?;

                        anyhow::Ok(())
                    })
                    .unwrap();

                    let alloc_info = allocation_counters.until_now();
                    allocations.push(alloc_info);
                });

                let sum =
                    allocations
                        .iter()
                        .fold(AllocationInfo::default(), |mut acc, allocation| {
                            acc.allocation_count += allocation.allocation_count;
                            acc.deallocation_count += allocation.deallocation_count;
                            acc.allocations += allocation.allocations;
                            acc.deallocations += allocation.deallocations;
                            acc
                        });
                let avg_alloc = AllocationInfo {
                    allocation_count: sum.allocation_count / allocations.len(),
                    deallocation_count: sum.deallocation_count / allocations.len(),
                    allocations: sum.allocations / allocations.len(),
                    deallocations: sum.deallocations / allocations.len(),
                };

                // Store the result
                benchmark_results.push((app_name.clone(), avg_alloc));
            },
        );
    }

    // Write all results to GITHUB_OUTPUT after benchmarks complete
    write_results_to_github_output(&benchmark_results);
}

fn write_results_to_github_output(results: &[(String, AllocationInfo)]) {
    if let Ok(output_file_path) = std::env::var("GITHUB_OUTPUT")
        && !results.is_empty()
    {
        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(output_file_path)
            .expect("Failed to open GITHUB_OUTPUT file");

        // Create markdown table
        let mut table = String::new();
        table.push_str("## Turbopack Build Apps Allocation Metrics\n");
        table.push_str(
            "| App | Allocation Count | Deallocation Count | Allocations (bytes) | Deallocations \
             (bytes) |\\n",
        );
        table.push_str("|-----|-----|-----|-----|-----|\\n");

        for (app_name, avg_alloc) in results.iter() {
            table.push_str(&format!(
                "| {} | {} | {} | {} | {} |\\n",
                app_name,
                avg_alloc.allocation_count,
                avg_alloc.deallocation_count,
                avg_alloc.allocations,
                avg_alloc.deallocations
            ));
        }

        writeln!(file, "result={table}").expect("Failed to write to GITHUB_OUTPUT file");
    }
}

criterion_group!(
  name = benches;
  config = Criterion::default().sample_size(10);
  targets = bench_small_apps
);
criterion_main!(benches);
