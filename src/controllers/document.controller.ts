import {
  BadRequestError,
  Body,
  Delete,
  Get,
  HeaderParam,
  HttpCode,
  JsonController,
  NotFoundError,
  Param,
  Post,
  QueryParam,
  QueryParams,
} from "routing-controllers";
import { StatusCodes } from "http-status-codes";
import { Inject, Service } from "typedi";
import { DocumentService } from "../services/document.service";
import { BaseController } from "../base";
import { SearchJobsValidator, SaveJobPostingValidator } from "../validators";

@JsonController()
@Service()
export class JobPostingController extends BaseController {
  @Inject(() => DocumentService)
  private readonly jobPostingService!: DocumentService;

  @Post("/documents")
  @HttpCode(StatusCodes.CREATED)
  async createJobPosting(
    @HeaderParam("x-tenant-id") tenantHeader: string,
    @QueryParam("tenant") tenantQuery: string,
    @Body({ required: true }) jobPostingInput: SaveJobPostingValidator
  ) {
    const tenantId = this.resolveTenant(tenantHeader, tenantQuery);
    if (!tenantId) {
      throw new BadRequestError("Missing tenant identifier");
    }

    const jobPosting = await this.jobPostingService.create(
      tenantId,
      jobPostingInput
    );
    return {
      error: false,
      statusCode: StatusCodes.CREATED,
      data: jobPosting,
    };
  }

  @Get("/documents/:id")
  async getJobPostingById(
    @HeaderParam("x-tenant-id") tenantHeader: string,
    @QueryParam("tenant") tenantQuery: string,
    @Param("id") jobPostingId: string
  ) {
    const tenantId = this.resolveTenant(tenantHeader, tenantQuery);
    if (!tenantId) {
      throw new BadRequestError("Missing tenant identifier");
    }

    const jobPosting = await this.jobPostingService.getById(
      tenantId,
      jobPostingId
    );
    if (!jobPosting) {
      throw new NotFoundError("Job posting not found");
    }

    return {
      error: false,
      statusCode: StatusCodes.OK,
      data: jobPosting,
    };
  }

  @Get("/search")
  async searchJobPostings(
    @HeaderParam("x-tenant-id") tenantHeader: string,
    @QueryParam("tenant") tenantQuery: string,
    @QueryParams() query: SearchJobsValidator
  ) {
    const tenantId = this.resolveTenant(tenantHeader, tenantQuery);
    if (!tenantId) {
      throw new BadRequestError("Missing tenant identifier");
    }

    const results = await this.jobPostingService.search(tenantId, query.q);
    return {
      error: false,
      statusCode: StatusCodes.OK,
      data: {
        query: query.q,
        tenantId,
        total: results.length,
        items: results,
      },
    };
  }

  @Delete("/documents/:id")
  @HttpCode(StatusCodes.NO_CONTENT)
  async deleteJobPosting(
    @HeaderParam("x-tenant-id") tenantHeader: string,
    @QueryParam("tenant") tenantQuery: string,
    @Param("id") jobPostingId: string
  ) {
    const tenantId = this.resolveTenant(tenantHeader, tenantQuery);
    if (!tenantId) {
      throw new BadRequestError("Missing tenant identifier");
    }

    const deleted = await this.jobPostingService.deleteById(
      tenantId,
      jobPostingId
    );
    if (!deleted) {
      throw new NotFoundError("Job posting not found");
    }
  }
}
