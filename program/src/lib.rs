use anchor_lang::prelude::*;

declare_id!("YourProgramIdHere");

#[program]
pub mod intent_market {
    use super::*;

    pub fn register_intent(
        ctx: Context<RegisterIntent>,
        title: String,
        description: String,
        category: Option<String>,
    ) -> Result<()> {
        let intent = &mut ctx.accounts.intent;
        intent.agent = ctx.accounts.agent.key();
        intent.title = title;
        intent.description = description;
        intent.category = category;
        intent.status = IntentStatus::Active;
        intent.created_at = Clock::get()?.unix_timestamp;
        intent.bump = ctx.bumps.intent;
        Ok(())
    }

    pub fn update_match_status(
        ctx: Context<UpdateMatchStatus>,
        status: u8,
    ) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;
        match_account.status = match status {
            0 => MatchStatus::Pending,
            1 => MatchStatus::Accepted,
            2 => MatchStatus::Rejected,
            3 => MatchStatus::Completed,
            _ => return Err(ErrorCode::InvalidStatus.into()),
        };
        match_account.updated_at = Clock::get()?.unix_timestamp;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct RegisterIntent<'info> {
    #[account(mut)]
    pub agent: Signer<'info>,
    
    #[account(
        init,
        payer = agent,
        space = 8 + Intent::LEN,
        seeds = [b"intent", agent.key().as_ref()],
        bump
    )]
    pub intent: Account<'info, Intent>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateMatchStatus<'info> {
    #[account(mut)]
    pub agent: Signer<'info>,
    
    #[account(
        mut,
        has_one = agent @ ErrorCode::Unauthorized
    )]
    pub match_account: Account<'info, Match>,
}

#[account]
pub struct Intent {
    pub agent: Pubkey,
    pub title: String,
    pub description: String,
    pub category: Option<String>,
    pub status: IntentStatus,
    pub created_at: i64,
    pub bump: u8,
}

#[account]
pub struct Match {
    pub intent_a: Pubkey,
    pub intent_b: Pubkey,
    pub match_score: u16, // 0-10000 (represents 0.00-100.00%)
    pub status: MatchStatus,
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum IntentStatus {
    Active,
    Fulfilled,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum MatchStatus {
    Pending,
    Accepted,
    Rejected,
    Completed,
}

impl Intent {
    pub const LEN: usize = 32 + // agent
        4 + 255 + // title (max 255 chars)
        4 + 1000 + // description (max 1000 chars)
        1 + 4 + 50 + // category (optional, max 50 chars)
        1 + // status
        8 + // created_at
        1; // bump
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid status")]
    InvalidStatus,
    #[msg("Unauthorized")]
    Unauthorized,
}
