#![feature(arbitrary_self_types)]
#![feature(arbitrary_self_types_pointers)]
#![allow(clippy::needless_return)] // tokio macro-generated code doesn't respect this

use anyhow::Result;
use turbo_tasks::{Vc, util::StaticOrArc};
use turbo_tasks_backend::{
    BackendOptions, GitVersionInfo, TurboTasksBackend, default_backing_storage,
};

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn static_construction() -> Result<()> {
    // Create a backend
    let path = std::path::PathBuf::from(format!(
        "{}/.cache/static_construction_test",
        env!("CARGO_TARGET_TMPDIR")
    ));
    let _ = std::fs::remove_dir_all(&path);
    std::fs::create_dir_all(&path).unwrap();

    let backend = TurboTasksBackend::new(
        BackendOptions {
            num_workers: Some(2),
            small_preallocation: true,
            ..Default::default()
        },
        default_backing_storage(
            path.as_path(),
            &GitVersionInfo {
                describe: "test-static-construction",
                dirty: false,
            },
            false,
            true,
        )
        .unwrap()
        .0,
    );

    // Use new_static instead of new
    let tt = turbo_tasks::TurboTasks::new_static(backend);

    // Coerce to trait object for use with run_once
    let tt_api: &'static dyn turbo_tasks::TurboTasksApi = tt;
    let tt_arc = StaticOrArc::Static(tt_api);

    // Run a simple test with the static TurboTasks
    let result = turbo_tasks::run_once(tt_arc.clone(), async move {
        let output = static_test_func();
        let value = output.await?;
        assert_eq!(value.value, 456);
        Ok(())
    })
    .await?;

    // Run it again to verify caching works
    turbo_tasks::run_once(tt_arc, async move {
        let output = static_test_func();
        let value = output.await?;
        assert_eq!(value.value, 456);
        Ok(())
    })
    .await?;

    Ok(result)
}

#[turbo_tasks::value]
#[derive(Clone, Debug)]
struct StaticTestValue {
    value: u32,
}

#[turbo_tasks::function]
fn static_test_func() -> Result<Vc<StaticTestValue>> {
    println!("static_test_func called");
    Ok(StaticTestValue { value: 456 }.cell())
}
