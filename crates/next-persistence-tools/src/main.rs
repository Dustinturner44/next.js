use std::{collections::HashMap, hash::Hasher, path::PathBuf};

use anyhow::{Context, Result, bail};
use clap::Parser;
use rustc_hash::FxHashMap;
use turbo_persistence::{OwnedLookupEntry, SerialScheduler, TurboPersistence};
use twox_hash::XxHash64;

/// CLI tool for analyzing Next.js Turbopack cache statistics
#[derive(Parser, Debug)]
#[command(name = "next-persistence-tools")]
#[command(about = "Analyze Next.js persistence cache and generate statistics", long_about = None)]
struct Args {
    /// Path to the TurboPersistence cache directory
    #[arg(value_name = "CACHE_PATH")]
    cache_path: PathBuf,

    /// Include overwritten/old values in the analysis
    #[arg(long, default_value_t = false)]
    include_overwritten: bool,
}

/// Statistics for a single cache family
#[derive(Default)]
struct FamilyStats {
    entry_count: u64,
    total_key_size: u64,
    total_value_size: u64,
    /// Maps value hash to (count, total_size)
    unique_value_hashes: FxHashMap<u64, (u64, u64)>,
    min_entry_size: Option<u64>,
    max_entry_size: Option<u64>,
}

impl FamilyStats {
    fn add_entry(&mut self, entry: &OwnedLookupEntry) {
        self.entry_count += 1;

        let key_size = entry.key.len() as u64;
        self.total_key_size += key_size;

        let value_size = entry.value.len() as u64;
        self.total_value_size += value_size;

        // Hash the value bytes for deduplication tracking
        let mut hasher = XxHash64::with_seed(0);
        hasher.write(&entry.value);
        let value_hash = hasher.finish();

        // Track duplicate sizes: increment count and add to total size
        self.unique_value_hashes
            .entry(value_hash)
            .and_modify(|(count, total_size)| {
                *count += 1;
                *total_size += value_size;
            })
            .or_insert((1, value_size));

        // Track entry size distribution
        let entry_size = key_size + value_size;
        self.min_entry_size = Some(
            self.min_entry_size
                .map_or(entry_size, |min| min.min(entry_size)),
        );
        self.max_entry_size = Some(
            self.max_entry_size
                .map_or(entry_size, |max| max.max(entry_size)),
        );
    }

    fn avg_entry_size(&self) -> u64 {
        if self.entry_count == 0 {
            0
        } else {
            (self.total_key_size + self.total_value_size) / self.entry_count
        }
    }

    fn total_size(&self) -> u64 {
        self.total_key_size + self.total_value_size
    }

    fn unique_value_count(&self) -> usize {
        self.unique_value_hashes.len()
    }

    fn duplicated_size(&self) -> u64 {
        // Sum up duplicate sizes: for each value that appears >1 time,
        // the duplicated size is (total_size - size_of_first_occurrence)
        self.unique_value_hashes
            .values()
            .filter_map(|&(count, total_size)| {
                if count > 1 {
                    // Duplicated size = total - first occurrence
                    // Since all occurrences have the same size: total_size / count * (count - 1)
                    let size_per_occurrence = total_size / count;
                    Some(size_per_occurrence * (count - 1))
                } else {
                    None
                }
            })
            .sum()
    }
}

/// Family names for the 5 KeySpaces used by TurboKeyValueDatabase
const FAMILY_NAMES: &[&str] = &[
    "Infra",            // 0: Infrastructure data
    "TaskMeta",         // 1: Task metadata
    "TaskData",         // 2: Task actual data
    "ForwardTaskCache", // 3: CachedTaskType -> TaskId lookups
    "ReverseTaskCache", // 4: TaskId -> CachedTaskType lookups
];

fn format_size(bytes: u64) -> String {
    const KIB: u64 = 1024;
    const MIB: u64 = 1024 * KIB;
    const GIB: u64 = 1024 * MIB;

    if bytes >= GIB {
        format!("{:.2} GiB", bytes as f64 / GIB as f64)
    } else if bytes >= MIB {
        format!("{:.2} MiB", bytes as f64 / MIB as f64)
    } else if bytes >= KIB {
        format!("{:.2} KiB", bytes as f64 / KIB as f64)
    } else {
        format!("{} B", bytes)
    }
}

fn main() -> Result<()> {
    let args = Args::parse();

    if !args.cache_path.exists() {
        bail!("Cache path does not exist: {}", args.cache_path.display());
    }

    println!("Analyzing cache at: {}", args.cache_path.display());
    println!("Include overwritten values: {}", args.include_overwritten);
    println!();

    // Open the database in read-only mode
    let db: TurboPersistence<SerialScheduler> =
        TurboPersistence::open_read_only(args.cache_path.clone())
            .context("Failed to open TurboPersistence database")?;

    // Collect statistics for each family
    let mut family_stats: HashMap<usize, FamilyStats> = HashMap::new();
    let mut total_entries = 0u64;
    let mut total_errors = 0u64;

    println!("Scanning cache families...");
    println!();

    // Iterate over each family (0-4)
    for family in 0..5 {
        let family_name = FAMILY_NAMES.get(family).unwrap_or(&"Unknown");
        print!("Processing family {}: {}... ", family, family_name);

        let stats = family_stats.entry(family).or_default();

        match db.iter(family, args.include_overwritten) {
            Ok(iter) => {
                let mut family_entries = 0u64;

                for entry_result in iter {
                    match entry_result {
                        Ok(entry) => {
                            stats.add_entry(&entry);
                            family_entries += 1;
                            total_entries += 1;
                        }
                        Err(e) => {
                            eprintln!("Error reading entry: {}", e);
                            total_errors += 1;
                        }
                    }
                }

                println!("{} entries", family_entries);
            }
            Err(e) => {
                println!("ERROR: {}", e);
                total_errors += 1;
            }
        }
    }

    println!();
    println!("═══════════════════════════════════════════════════════════════════════════");
    println!("                         CACHE STATISTICS SUMMARY");
    println!("═══════════════════════════════════════════════════════════════════════════");
    println!();

    // Print per-family statistics
    println!("PER-FAMILY STATISTICS:");
    println!("─────────────────────────────────────────────────────────────────────────────");
    println!(
        "{:<20} {:>12} {:>15} {:>15} {:>15}",
        "Family", "Entries", "Total Size", "Unique Values", "Avg Entry Size"
    );
    println!("─────────────────────────────────────────────────────────────────────────────");

    let mut grand_total_size = 0u64;
    let mut grand_unique_values = 0u64;

    for family in 0..5 {
        if let Some(stats) = family_stats.get(&family) {
            let family_name = FAMILY_NAMES.get(family).unwrap_or(&"Unknown");
            println!(
                "{:<20} {:>12} {:>15} {:>15} {:>15}",
                family_name,
                stats.entry_count,
                format_size(stats.total_size()),
                stats.unique_value_hashes.len(),
                format_size(stats.avg_entry_size())
            );

            grand_total_size += stats.total_size();
            grand_unique_values += stats.unique_value_hashes.len() as u64;
        }
    }

    println!("─────────────────────────────────────────────────────────────────────────────");
    println!(
        "{:<20} {:>12} {:>15} {:>15}",
        "TOTAL",
        total_entries,
        format_size(grand_total_size),
        grand_unique_values
    );
    println!();

    // Print detailed breakdown for each family
    println!();
    println!("DETAILED FAMILY BREAKDOWN:");
    println!("═══════════════════════════════════════════════════════════════════════════");

    for family in 0..5 {
        if let Some(stats) = family_stats.get(&family) {
            if stats.entry_count == 0 {
                continue;
            }

            let family_name = FAMILY_NAMES.get(family).unwrap_or(&"Unknown");
            println!();
            println!("Family {}: {}", family, family_name);
            println!(
                "─────────────────────────────────────────────────────────────────────────────"
            );
            println!("  Entries:           {}", stats.entry_count);
            println!("  Total key size:    {}", format_size(stats.total_key_size));
            println!(
                "  Total value size:  {}",
                format_size(stats.total_value_size)
            );
            println!("  Total size:        {}", format_size(stats.total_size()));
            println!(
                "  Unique values:     {} ({:.1}% deduplication)",
                stats.unique_value_count(),
                if stats.entry_count > 0 {
                    (1.0 - stats.unique_value_count() as f64 / stats.entry_count as f64) * 100.0
                } else {
                    0.0
                }
            );
            let dup_size = stats.duplicated_size();
            let dup_pct = if stats.total_value_size > 0 {
                (dup_size as f64 / stats.total_value_size as f64) * 100.0
            } else {
                0.0
            };
            println!(
                "  Duplicated size:   {} ({:.1}% of total value size)",
                format_size(dup_size),
                dup_pct
            );
            println!(
                "  Avg entry size:    {}",
                format_size(stats.avg_entry_size())
            );
            println!(
                "  Min entry size:    {}",
                stats
                    .min_entry_size
                    .map(format_size)
                    .unwrap_or_else(|| "N/A".to_string())
            );
            println!(
                "  Max entry size:    {}",
                stats
                    .max_entry_size
                    .map(format_size)
                    .unwrap_or_else(|| "N/A".to_string())
            );

            // Calculate percentage of total
            let pct = if grand_total_size > 0 {
                (stats.total_size() as f64 / grand_total_size as f64) * 100.0
            } else {
                0.0
            };
            println!("  % of total:        {:.1}%", pct);
        }
    }

    println!();
    println!("═══════════════════════════════════════════════════════════════════════════");

    if total_errors > 0 {
        println!();
        println!("⚠️  Total errors encountered: {}", total_errors);
    }

    println!();
    println!("Analysis complete!");

    Ok(())
}
