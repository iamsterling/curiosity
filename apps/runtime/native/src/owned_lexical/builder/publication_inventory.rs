//! Exact closed-tree and prospective root-cap accounting.

use super::publication_fs::Directory;
use super::*;

pub(super) const MAX_ENTRIES: u64 = 768;
pub(super) const MAX_BYTES: u64 = 2_415_919_104;

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub(super) struct InventoryCharge {
    pub entries: u64,
    pub bytes: u64,
}

impl InventoryCharge {
    fn add_entry(&mut self) -> Result<()> {
        self.entries = self.entries.checked_add(1).ok_or_else(limit)?;
        if self.entries > MAX_ENTRIES {
            return Err(limit());
        }
        Ok(())
    }

    fn add_bytes(&mut self, bytes: u64) -> Result<()> {
        self.bytes = self.bytes.checked_add(bytes).ok_or_else(limit)?;
        if self.bytes > MAX_BYTES {
            return Err(limit());
        }
        Ok(())
    }

    pub fn prospective(self, entries: u64, bytes: u64) -> Result<()> {
        let entries = self.entries.checked_add(entries).ok_or_else(limit)?;
        let bytes = self.bytes.checked_add(bytes).ok_or_else(limit)?;
        if entries > MAX_ENTRIES || bytes > MAX_BYTES {
            return Err(limit());
        }
        Ok(())
    }
}

#[cfg(test)]
pub(super) fn test_charge(
    entries: u64,
    bytes: u64,
    add_entries: u64,
    add_bytes: u64,
) -> Result<()> {
    InventoryCharge { entries, bytes }.prospective(add_entries, add_bytes)
}

pub(super) fn inspect(root: &Directory) -> Result<InventoryCharge> {
    let identity = root.identity();
    if identity.owner != current_uid() || identity.mode & 0o7777 != 0o700 {
        return Err(Failure::new(Code::RootInvalid, Phase::Root, FileKind::Root));
    }
    let mut charge = InventoryCharge::default();
    walk(root, identity.device, identity.owner, &mut charge)?;
    Ok(charge)
}

fn walk(
    directory: &Directory,
    device: u64,
    owner: u32,
    charge: &mut InventoryCharge,
) -> Result<()> {
    charge.add_entry()?;
    for name in directory.names().map_err(|_| invalid())? {
        if let Ok(child) = directory.open_dir(&name) {
            let identity = child.identity();
            if identity.device != device
                || identity.owner != owner
                || identity.mode & 0o7777 != 0o700
            {
                return Err(invalid());
            }
            walk(&child, device, owner, charge)?;
            child.verify_namespace_identity().map_err(|_| invalid())?;
            continue;
        }
        let file = directory.open_file(&name, false).map_err(|_| invalid())?;
        let identity = file.identity();
        if identity.device != device
            || identity.owner != owner
            || identity.mode & 0o7777 != 0o600
            || identity.links != 1
        {
            return Err(invalid());
        }
        charge.add_entry()?;
        charge.add_bytes(identity.length)?;
        file.verify_final(identity.length).map_err(|_| invalid())?;
    }
    directory.verify_namespace_identity().map_err(|_| invalid())
}

fn current_uid() -> u32 {
    unsafe extern "C" {
        fn geteuid() -> u32;
    }
    // SAFETY: geteuid has no preconditions.
    unsafe { geteuid() }
}

fn invalid() -> Failure {
    Failure::new(Code::InventoryInvalid, Phase::Root, FileKind::Root)
}

fn limit() -> Failure {
    Failure::new(Code::RootResourceLimit, Phase::Root, FileKind::Root)
}
